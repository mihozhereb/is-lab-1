package ru.mihozhereb.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "address", indexes = @Index(name = "address_town_idx", columnList = "town_id"))
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @NotNull(message = "не может быть null")
    @Size(max = 182, message = "длина не должна быть больше 182")
    @Column(name = "street", nullable = false, length = 182)
    private String street; //Длина строки не должна быть больше 182, Поле не может быть null

    @NotNull(message = "не может быть null")
    @Size(max = 12, message = "длина не должна быть больше 12")
    @Column(name = "zip_code", nullable = false, length = 12)
    private String zipCode; //Длина строки не должна быть больше 12, Поле не может быть null

    @NotNull(message = "не может быть null")
    @Valid
    @ManyToOne(optional = false, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "town_id", nullable = false, foreignKey = @ForeignKey(name = "address_town_fk"))
    private Location town; //Поле не может быть null

    public Long getId() {
        return id;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getZipCode() {
        return zipCode;
    }

    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    public Location getTown() {
        return town;
    }

    public void setTown(Location town) {
        this.town = town;
    }
}
