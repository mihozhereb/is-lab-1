package ru.mihozhereb.realtime;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.Dependent;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;
import jakarta.servlet.http.HttpSession;
import jakarta.websocket.CloseReason;
import jakarta.websocket.HandshakeResponse;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.HandshakeRequest;
import jakarta.websocket.server.ServerEndpoint;
import jakarta.websocket.server.ServerEndpointConfig;
import ru.mihozhereb.service.AuthService;
import ru.mihozhereb.service.EntityChange;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Dependent
@ServerEndpoint(value = "/ws/updates", configurator = UpdatesEndpoint.SessionCheck.class)
public class UpdatesEndpoint {
    private static final Set<Session> SESSIONS = ConcurrentHashMap.newKeySet();
    private static final ObjectMapper JSON = new ObjectMapper();

    @OnOpen
    public void open(Session session) throws IOException {
        if (session.getUserProperties().get(AuthService.SESSION_USER) == null) {
            session.close(new CloseReason(CloseReason.CloseCodes.VIOLATED_POLICY, "Войдите в систему"));
        } else {
            SESSIONS.add(session);
        }
    }

    @OnClose
    public void close(Session session) {
        SESSIONS.remove(session);
    }

    @OnError
    public void error(Session session, Throwable error) {
        SESSIONS.remove(session);
    }

    static void broadcast(@Observes(during = TransactionPhase.AFTER_SUCCESS) EntityChange change)
            throws JsonProcessingException {
        String message = JSON.writeValueAsString(change);
        for (Session session : SESSIONS) {
            synchronized (session) {
                try {
                    session.getBasicRemote().sendText(message);
                } catch (IOException | IllegalStateException e) {
                    SESSIONS.remove(session);
                }
            }
        }
    }

    public static class SessionCheck extends ServerEndpointConfig.Configurator {
        @Override
        public void modifyHandshake(ServerEndpointConfig config, HandshakeRequest request, HandshakeResponse response) {
            HttpSession session = (HttpSession) request.getHttpSession();
            Object user = session == null ? null : session.getAttribute(AuthService.SESSION_USER);
            if (user == null) {
                config.getUserProperties().remove(AuthService.SESSION_USER);
            } else {
                config.getUserProperties().put(AuthService.SESSION_USER, user);
            }
        }
    }
}
