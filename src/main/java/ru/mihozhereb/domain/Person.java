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
@Table(name = "person", indexes = @Index(name = "person_location_idx", columnList = "location_id"))
public class Person {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @NotBlank(message = "не может быть null или пустой строкой")
    @Check(name = "person_name_not_blank", constraints = "name ~ '\\S'")
    @Column(name = "name", nullable = false, columnDefinition = "text")
    private String name; //Поле не может быть null, Строка не может быть пустой

    @Enumerated(EnumType.STRING)
    @Column(name = "eye_color", length = 16)
    private Color eyeColor; //Поле может быть null

    @NotNull(message = "не может быть null")
    @Enumerated(EnumType.STRING)
    @Column(name = "hair_color", nullable = false, length = 16)
    private Color hairColor; //Поле не может быть null

    @NotNull(message = "не может быть null")
    @Valid
    @ManyToOne(optional = false, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "location_id", nullable = false, foreignKey = @ForeignKey(name = "person_location_fk"))
    private Location location; //Поле не может быть null

    @Positive(message = "должно быть больше 0")
    @Check(name = "person_weight_positive", constraints = "weight > 0")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @Column(name = "weight", nullable = false)
    private long weight; //Значение поля должно быть больше 0

    @NotNull(message = "не может быть null")
    @Enumerated(EnumType.STRING)
    @Column(name = "nationality", nullable = false, length = 16)
    private Country nationality; //Поле не может быть null

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Color getEyeColor() {
        return eyeColor;
    }

    public void setEyeColor(Color eyeColor) {
        this.eyeColor = eyeColor;
    }

    public Color getHairColor() {
        return hairColor;
    }

    public void setHairColor(Color hairColor) {
        this.hairColor = hairColor;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public long getWeight() {
        return weight;
    }

    public void setWeight(long weight) {
        this.weight = weight;
    }

    public Country getNationality() {
        return nationality;
    }

    public void setNationality(Country nationality) {
        this.nationality = nationality;
    }
}
