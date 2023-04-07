use array::ArrayTrait;

use redstone::numbers::Felt252PartialOrd;
use redstone::numbers::Felt252Div;
use redstone::sort::SortableTrait;
use redstone::gas::out_of_gas_array;
use integer::u32_safe_divmod;
use integer::u32_as_non_zero;

fn aggregate_values(values: @Array<@Array<felt252>>, index: usize, ref res: Array<felt252>) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == values.len()) {
        return ();
    }

    res.append(median_value(*values[index]));

    aggregate_values(:values, index: index + 1_usize, ref :res)
}

fn median_value(arr: @Array<felt252>) -> felt252 {
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
