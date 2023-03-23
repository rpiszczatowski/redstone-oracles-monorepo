use array::ArrayTrait;

use redstone::numbers::Felt252PartialOrd;
use redstone::numbers::Felt252Div;
use redstone::sort::SortableTrait;
use integer::u32_safe_divmod;
use integer::u32_as_non_zero;

fn aggregate_values(values: Array<@Array<felt252>>, index: usize, ref res: Array<felt252>) {
    if (index == values.len()) {
        return ();
    }

    res.append(aggregate(*values[index]));

    aggregate_values(:values, index: index + 1_usize, ref :res)
}

fn aggregate(arr: @Array<felt252>) -> felt252 {
    if (arr.len() == 1_usize) { // Optimalization to avoid sorting & array copying
        return *arr[0_usize];
    }

    if (arr.len() == 2_usize) { //  Optimalization to avoid sorting & array copying 
        return (*arr[0_usize] + *arr[1_usize]) / 2;
    }

    let sorted_arr = arr.sorted();

    let (index, rest) = u32_safe_divmod(arr.len(), u32_as_non_zero(2_usize));

    if (rest == 1_usize) {
        *sorted_arr[index]
    } else {
        (*sorted_arr[index] + *sorted_arr[index - 1_usize]) / 2
    }
}
