package ru.mihozhereb.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "coordinates")
public class Coordinates {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @DecimalMax(value = "850", message = "максимальное значение: 850")
    @Check(name = "coordinates_x_max", constraints = "x <= 850")
    @Column(name = "x", nullable = false)
    private double x; //Максимальное значение поля: 850

    @DecimalMax(value = "842", message = "максимальное значение: 842")
    @Check(name = "coordinates_y_max", constraints = "y <= 842")
    @Column(name = "y", nullable = false)
    private float y; //Максимальное значение поля: 842

    public Long getId() {
        return id;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public float getY() {
        return y;
    }

    public void setY(float y) {
        this.y = y;
    }
}
