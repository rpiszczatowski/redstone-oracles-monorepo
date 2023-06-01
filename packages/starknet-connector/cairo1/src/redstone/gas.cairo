use array::ArrayTrait;

fn out_of_gas_array() -> Array<felt252> {
    let mut arr = Default::default();
    arr.append('Out of gas');

    arr
}
