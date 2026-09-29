package ru.mihozhereb.domain;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Ограничения полей из задания на уровне ORM (Bean Validation), граничные значения. */
class EntityValidationTest {
    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    // ---------- фабрики корректных объектов ----------

    static Location location() {
        Location location = new Location();
        location.setX(1f);
        location.setY(2f);
        location.setName("Москва");
        return location;
    }

    static Address address() {
        Address address = new Address();
        address.setStreet("Ленина 1");
        address.setZipCode("123456");
        address.setTown(location());
        return address;
    }

    static Coordinates coordinates() {
        Coordinates coordinates = new Coordinates();
        coordinates.setX(1);
        coordinates.setY(1);
        return coordinates;
    }

    static Organization organization() {
        Organization organization = new Organization();
        organization.setName("Ромашка");
        organization.setAnnualTurnover(1);
        organization.setEmployeesCount(1);
        organization.setFullName("ООО Ромашка");
        organization.setPostalAddress(address());
        return organization;
    }

    static Person person() {
        Person person = new Person();
        person.setName("Иван");
        person.setHairColor(Color.BROWN);
        person.setLocation(location());
        person.setWeight(1);
        person.setNationality(Country.RUSSIA);
        return person;
    }

    static Product product() {
        Product product = new Product();
        product.setName("Молоко");
        product.setCoordinates(coordinates());
        product.setManufacturer(organization());
        product.setRating(0.1f);
        product.setOwner(person());
        return product;
    }

    private static <T> Set<String> invalidFields(T object, Class<?>... groups) {
        Set<ConstraintViolation<T>> violations = validator.validate(object, groups);
        return violations.stream().map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
    }

    private static <T> void assertValid(T object) {
        assertEquals(Set.of(), invalidFields(object));
    }

    private static <T> void assertInvalid(T object, String field) {
        assertEquals(Set.of(field), invalidFields(object));
    }

    private static void setField(Object target, String name, Object value) throws ReflectiveOperationException {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    // ---------- Product ----------

    @Test
    void validObjectsHaveNoViolations() {
        assertValid(location());
        assertValid(address());
        assertValid(coordinates());
        assertValid(organization());
        assertValid(person());
        assertValid(product());
    }

    @Test
    void productNameMustNotBeNullOrEmpty() {
        for (String name : new String[]{null, "", "   "}) {
            Product product = product();
            product.setName(name);
            assertInvalid(product, "name");
        }
    }

    @Test
    void productReferencesMustNotBeNull() {
        Product product = product();
        product.setCoordinates(null);
        assertInvalid(product, "coordinates");

        product = product();
        product.setManufacturer(null);
        assertInvalid(product, "manufacturer");

        product = product();
        product.setOwner(null);
        assertInvalid(product, "owner");
    }

    @Test
    void productOptionalFieldsMayBeNull() {
        Product product = product();
        product.setUnitOfMeasure(null);
        product.setPrice(null);
        product.setPartNumber(null);
        assertValid(product);
    }

    @Test
    void productPriceMustBePositive() {
        Product product = product();
        product.setPrice(0);
        assertInvalid(product, "price");
        product.setPrice(-5);
        assertInvalid(product, "price");
        product.setPrice(1);
        assertValid(product);
    }

    @Test
    void productRatingMustBePositive() {
        Product product = product();
        product.setRating(0f);
        assertInvalid(product, "rating");
        product.setRating(-0.5f);
        assertInvalid(product, "rating");
        product.setRating(Float.MIN_VALUE);
        assertValid(product);
    }

    @Test
    void productPartNumberLengthIsAtMost100() {
        Product product = product();
        product.setPartNumber("x".repeat(100));
        assertValid(product);
        product.setPartNumber("x".repeat(101));
        assertInvalid(product, "partNumber");
    }

    @Test
    void generatedProductFieldsAreCheckedAfterInsert() throws ReflectiveOperationException {
        Product product = product();
        // До INSERT id = 0 и creationDate = null: группа Persisted не проверяется.
        assertValid(product);
        // @Valid каскадом проверяет и связанную организацию (у неё тоже ещё нет id).
        assertEquals(Set.of("id", "creationDate", "manufacturer.id"), invalidFields(product, Persisted.class));
        setField(product, "id", 1L);
        setField(product, "creationDate", java.time.LocalDate.now());
        setField(product.getManufacturer(), "id", 1L);
        assertTrue(invalidFields(product, Persisted.class).isEmpty());
    }

    // ---------- Coordinates ----------

    @Test
    void coordinatesXIsAtMost850() {
        Coordinates coordinates = coordinates();
        coordinates.setX(850);
        assertValid(coordinates);
        coordinates.setX(850.0001);
        assertInvalid(coordinates, "x");
        coordinates.setX(-1e300);
        assertValid(coordinates);
    }

    @Test
    void coordinatesYIsAtMost842() {
        Coordinates coordinates = coordinates();
        coordinates.setY(842f);
        assertValid(coordinates);
        coordinates.setY(842.01f);
        assertInvalid(coordinates, "y");
    }

    // ---------- Organization ----------

    @Test
    void organizationConstraints() throws ReflectiveOperationException {
        Organization organization = organization();
        organization.setName(" ");
        assertInvalid(organization, "name");

        organization = organization();
        organization.setAnnualTurnover(0);
        assertInvalid(organization, "annualTurnover");

        organization = organization();
        organization.setEmployeesCount(0);
        assertInvalid(organization, "employeesCount");

        organization = organization();
        organization.setFullName(null);
        assertInvalid(organization, "fullName");

        organization = organization();
        organization.setFullName("");
        assertValid(organization);

        organization = organization();
        organization.setPostalAddress(null);
        assertInvalid(organization, "postalAddress");

        organization = organization();
        organization.setOfficialAddress(null);
        organization.setType(null);
        assertValid(organization);

        organization = organization();
        assertEquals(Set.of("id"), invalidFields(organization, Persisted.class));
        setField(organization, "id", 0L);
        assertEquals(Set.of("id"), invalidFields(organization, Persisted.class));
        setField(organization, "id", 1L);
        assertTrue(invalidFields(organization, Persisted.class).isEmpty());
    }

    // ---------- Person ----------

    @Test
    void personConstraints() {
        Person person = person();
        person.setName("");
        assertInvalid(person, "name");

        person = person();
        person.setEyeColor(null);
        assertValid(person);

        person = person();
        person.setHairColor(null);
        assertInvalid(person, "hairColor");

        person = person();
        person.setLocation(null);
        assertInvalid(person, "location");

        person = person();
        person.setWeight(0);
        assertInvalid(person, "weight");

        person = person();
        person.setNationality(null);
        assertInvalid(person, "nationality");
    }

    // ---------- Address, Location ----------

    @Test
    void addressConstraints() {
        Address address = address();
        address.setStreet(null);
        assertInvalid(address, "street");

        address = address();
        address.setStreet("s".repeat(182));
        assertValid(address);
        address.setStreet("s".repeat(183));
        assertInvalid(address, "street");

        address = address();
        address.setZipCode("1".repeat(12));
        assertValid(address);
        address.setZipCode("1".repeat(13));
        assertInvalid(address, "zipCode");

        address = address();
        address.setZipCode(null);
        assertInvalid(address, "zipCode");

        address = address();
        address.setTown(null);
        assertInvalid(address, "town");
    }

    @Test
    void locationConstraints() {
        Location location = location();
        location.setY(null);
        assertInvalid(location, "y");

        location = location();
        location.setName(null);
        assertInvalid(location, "name");

        location = location();
        location.setName("");
        assertValid(location);
    }
}
