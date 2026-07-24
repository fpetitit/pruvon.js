export const sum = (values) => {
    let sum = 0;
    values.forEach(element =>
        sum += element
    );
    return sum;
};

export const sub = (a, b) => {
    return a - b;
};
