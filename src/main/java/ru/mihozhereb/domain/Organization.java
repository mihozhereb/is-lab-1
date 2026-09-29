package ru.mihozhereb.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "organization", indexes = {
        @Index(name = "organization_official_address_idx", columnList = "official_address_id"),
        @Index(name = "organization_postal_address_idx", columnList = "postal_address_id")})
public class Organization {
    @NotNull(groups = Persisted.class, message = "не может быть null")
    @Positive(groups = Persisted.class, message = "должно быть больше 0")
    @Check(name = "organization_id_positive", constraints = "id > 0")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id; //Поле не может быть null, Значение поля должно быть больше 0, Значение этого поля должно быть уникальным, Значение этого поля должно генерироваться автоматически

    @NotBlank(message = "не может быть null или пустой строкой")
    @Check(name = "organization_name_not_blank", constraints = "name ~ '\\S'")
    @Column(name = "name", nullable = false, columnDefinition = "text")
    private String name; //Поле не может быть null, Строка не может быть пустой

    @Valid
    @ManyToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "official_address_id", foreignKey = @ForeignKey(name = "organization_official_address_fk"))
    private Address officialAddress; //Поле может быть null

    @Positive(message = "должно быть больше 0")
    @Check(name = "organization_annual_turnover_positive", constraints = "annual_turnover > 0")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @Column(name = "annual_turnover", nullable = false)
    private long annualTurnover; //Значение поля должно быть больше 0

    @Positive(message = "должно быть больше 0")
    @Check(name = "organization_employees_count_positive", constraints = "employees_count > 0")
    @Column(name = "employees_count", nullable = false)
    private int employeesCount; //Значение поля должно быть больше 0

    @NotNull(message = "не может быть null")
    @Column(name = "full_name", nullable = false, columnDefinition = "text")
    private String fullName; //Поле не может быть null

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 32)
    private OrganizationType type; //Поле может быть null

    @NotNull(message = "не может быть null")
    @Valid
    @ManyToOne(optional = false, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "postal_address_id", nullable = false, foreignKey = @ForeignKey(name = "organization_postal_address_fk"))
    private Address postalAddress; //Поле не может быть null

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Address getOfficialAddress() {
        return officialAddress;
    }

    public void setOfficialAddress(Address officialAddress) {
        this.officialAddress = officialAddress;
    }

    public long getAnnualTurnover() {
        return annualTurnover;
    }

    public void setAnnualTurnover(long annualTurnover) {
        this.annualTurnover = annualTurnover;
    }

    public int getEmployeesCount() {
        return employeesCount;
    }

    public void setEmployeesCount(int employeesCount) {
        this.employeesCount = employeesCount;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public OrganizationType getType() {
        return type;
    }

    public void setType(OrganizationType type) {
        this.type = type;
    }

    public Address getPostalAddress() {
        return postalAddress;
    }

    public void setPostalAddress(Address postalAddress) {
        this.postalAddress = postalAddress;
    }
}
