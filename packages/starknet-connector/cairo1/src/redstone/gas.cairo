use array::ArrayTrait;

fn out_of_gas_array() -> Array<felt252> {
    let mut arr = ArrayTrait::new();
    arr.append('Out of gas');

    arr
}
