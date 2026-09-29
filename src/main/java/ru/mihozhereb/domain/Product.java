package ru.mihozhereb.domain;

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
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Generated;

import java.time.LocalDate;

@Entity
@Table(name = "product",
        uniqueConstraints = @UniqueConstraint(name = "product_part_number_unique", columnNames = "part_number"),
        indexes = {
                @Index(name = "product_coordinates_idx", columnList = "coordinates_id"),
                @Index(name = "product_manufacturer_idx", columnList = "manufacturer_id"),
                @Index(name = "product_owner_idx", columnList = "owner_id")})
public class Product {
    @Positive(groups = Persisted.class, message = "должно быть больше 0")
    @Check(name = "product_id_positive", constraints = "id > 0")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private long id; //Значение поля должно быть больше 0, Значение этого поля должно быть уникальным, Значение этого поля должно генерироваться автоматически

    @NotBlank(message = "не может быть null или пустой строкой")
    @Check(name = "product_name_not_blank", constraints = "name ~ '\\S'")
    @Column(name = "name", nullable = false, columnDefinition = "text")
    private String name; //Поле не может быть null, Строка не может быть пустой

    @NotNull(message = "не может быть null")
    @Valid
    @ManyToOne(optional = false, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "coordinates_id", nullable = false, foreignKey = @ForeignKey(name = "product_coordinates_fk"))
    private Coordinates coordinates; //Поле не может быть null

    @NotNull(groups = Persisted.class, message = "не может быть null")
    @Generated
    @ColumnDefault("CURRENT_DATE")
    @Column(name = "creation_date", nullable = false, insertable = false, updatable = false)
    private LocalDate creationDate; //Поле не может быть null, Значение этого поля должно генерироваться автоматически

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_of_measure", length = 16)
    private UnitOfMeasure unitOfMeasure; //Поле может быть null

    @NotNull(message = "не может быть null")
    @Valid
    @ManyToOne(optional = false, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "manufacturer_id", nullable = false, foreignKey = @ForeignKey(name = "product_manufacturer_fk"))
    private Organization manufacturer; //Поле не может быть null

    @Positive(message = "должно быть больше 0")
    @Check(name = "product_price_positive", constraints = "price > 0")
    @Column(name = "price")
    private Integer price; //Поле может быть null, Значение поля должно быть больше 0

    @Column(name = "manufacture_cost", nullable = false)
    private double manufactureCost;

    @Positive(message = "должно быть больше 0")
    @Check(name = "product_rating_positive", constraints = "rating > 0")
    @Column(name = "rating", nullable = false)
    private float rating; //Значение поля должно быть больше 0

    @Size(max = 100, message = "длина не должна быть больше 100")
    @Column(name = "part_number", length = 100)
    private String partNumber; //Длина строки не должна быть больше 100, Значение этого поля должно быть уникальным, Поле может быть null

    @NotNull(message = "не может быть null")
    @Valid
    @ManyToOne(optional = false, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "owner_id", nullable = false, foreignKey = @ForeignKey(name = "product_owner_fk"))
    private Person owner; //Поле не может быть null

    public long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Coordinates getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(Coordinates coordinates) {
        this.coordinates = coordinates;
    }

    public LocalDate getCreationDate() {
        return creationDate;
    }

    public UnitOfMeasure getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public void setUnitOfMeasure(UnitOfMeasure unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }

    public Organization getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(Organization manufacturer) {
        this.manufacturer = manufacturer;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public double getManufactureCost() {
        return manufactureCost;
    }

    public void setManufactureCost(double manufactureCost) {
        this.manufactureCost = manufactureCost;
    }

    public float getRating() {
        return rating;
    }

    public void setRating(float rating) {
        this.rating = rating;
    }

    public String getPartNumber() {
        return partNumber;
    }

    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }

    public Person getOwner() {
        return owner;
    }

    public void setOwner(Person owner) {
        this.owner = owner;
    }
}
