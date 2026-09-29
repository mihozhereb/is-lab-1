
DROP FUNCTION IF EXISTS delete_product_by_part_number(VARCHAR);
DROP FUNCTION IF EXISTS get_product_with_min_coordinates();
DROP FUNCTION IF EXISTS get_products_with_owner_greater_than(BIGINT);
DROP FUNCTION IF EXISTS get_products_by_units_of_measure(TEXT[]);
DROP FUNCTION IF EXISTS decrease_prices(NUMERIC);

-- Удалить один (любой) объект, значение поля partNumber которого эквивалентно заданному.
-- Возвращает id удалённого объекта или NULL, если такого объекта нет.
CREATE FUNCTION delete_product_by_part_number(p_part_number VARCHAR)
    RETURNS BIGINT
    LANGUAGE plpgsql
AS
$$
DECLARE
    v_id BIGINT;
BEGIN
    SELECT id INTO v_id
    FROM product
    WHERE part_number IS NOT DISTINCT FROM p_part_number
    ORDER BY id
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        DELETE FROM product WHERE id = v_id;
    END IF;
    RETURN v_id;
END
$$;

-- Вернуть один (любой) объект, значение поля coordinates которого является минимальным.
-- Coordinates сравниваются по расстоянию до начала координат.
CREATE FUNCTION get_product_with_min_coordinates()
    RETURNS SETOF product
    LANGUAGE sql
    STABLE
AS
$$
SELECT p.*
FROM product p
         JOIN coordinates c ON c.id = p.coordinates_id
ORDER BY (c.x::NUMERIC * c.x::NUMERIC + c.y::NUMERIC * c.y::NUMERIC), c.x, c.y, p.id
LIMIT 1
$$;

-- Вернуть массив объектов, значение поля owner которых больше заданного.
-- Person сравниваются по weight, при равном весе - по name.
CREATE FUNCTION get_products_with_owner_greater_than(p_person_id BIGINT)
    RETURNS SETOF product
    LANGUAGE plpgsql
    STABLE
AS
$$
DECLARE
    v_weight BIGINT;
    v_name   TEXT;
BEGIN
    SELECT weight, name INTO v_weight, v_name FROM person WHERE id = p_person_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Person с id % не найден', p_person_id USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
        SELECT p.*
        FROM product p
                 JOIN person o ON o.id = p.owner_id
        WHERE (o.weight, o.name) > (v_weight, v_name)
        ORDER BY p.id;
END
$$;

-- Выбрать всю продукцию, характеристики которой определяются заданными единицами измерения.
CREATE FUNCTION get_products_by_units_of_measure(p_units TEXT[])
    RETURNS SETOF product
    LANGUAGE sql
    STABLE
AS
$$
SELECT *
FROM product
WHERE unit_of_measure = ANY (p_units)
ORDER BY id
$$;

-- Снизить цену всей продукции на указанный процент.
-- Возвращает число изменённых записей.
CREATE FUNCTION decrease_prices(p_percent NUMERIC)
    RETURNS INTEGER
    LANGUAGE plpgsql
AS
$$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_percent IS NULL OR p_percent <= 0 OR p_percent >= 100 THEN
        RAISE EXCEPTION 'Процент должен быть в интервале (0; 100), получено %', p_percent
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    UPDATE product
    SET price = GREATEST(1, ROUND(price * (100 - p_percent) / 100))::INTEGER
    WHERE price IS NOT NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END
$$;
