use array::ArrayTrait;
use dict::Felt252DictTrait;
use integer::u32_to_felt252;
use integer::u32_safe_divmod;
use integer::u32_as_non_zero;
use option::OptionTrait;

use redstone::dict::OptionalDictTrait;
use redstone::protocol::Payload;
use redstone::protocol::DataPackage;
use redstone::protocol::DataPoint;
use redstone::protocol::get_payload_from_bytes;
use redstone::config::Config;
use redstone::config::ConfigurableTrait;
use redstone::config_validation::ValidableTrait;
use redstone::config::index_in_array;
use redstone::aggregation::aggregate_values;
use redstone::results::Results;
use redstone::numbers::Felt252PartialOrd;
use redstone::gas::out_of_gas_array;

fn process_payload(payload_bytes: Array<u8>, config: Config) -> Results {
    let payload = get_payload_from_bytes(arr: payload_bytes, validator: config);
    let tmp_signer_count = payload.data_packages.len();
    let mut dict: Felt252Dict<felt252> = OptionalDictTrait::new_of_size(
        config.cap(tmp_signer_count)
    );
    make_values_dict(data_packages: payload.data_packages, :config, index: 0_usize, ref :dict);

    let mut tmp_arr: Array<felt252> = ArrayTrait::new();
    let mut matrix: Array<@Array<felt252>> = ArrayTrait::new();
    make_values_matrix(
        ref :dict, :config, :tmp_signer_count, index: 0_usize, ref :tmp_arr, ref :matrix
    );

    let mut aggregated_values: Array<felt252> = ArrayTrait::new();
    aggregate_values(values: @matrix, index: 0_usize, ref res: aggregated_values);

    let min_timestamp = get_min_timestamp(
        data_packages: payload.data_packages, index: 0, acc: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
    );

    Results { min_timestamp, aggregated_values: @aggregated_values, values: @matrix }
}

fn make_values_matrix(
    ref dict: Felt252Dict<felt252>,
    config: Config,
    tmp_signer_count: usize,
    index: usize,
    ref tmp_arr: Array<felt252>,
    ref matrix: Array<@Array<felt252>>
) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    let (feed_index, signer_index) = u32_safe_divmod(index, u32_as_non_zero(tmp_signer_count));

    if (signer_index == 0_usize) {
        if (index != 0_usize) {
            config.validate_signer_count(feed_index: feed_index - 1_usize, count: tmp_arr.len());
            matrix.append(@tmp_arr);
        }
        tmp_arr = ArrayTrait::new();
    }

    if (index == config.cap(tmp_signer_count)) {
        return ();
    }

    let price = dict
        .get_or_none(
            u32_to_felt252(
                index_in_array(:feed_index, :signer_index, signer_count: tmp_signer_count)
            )
        );

    match (price) {
        Option::Some(x) => tmp_arr.append(x),
        Option::None(()) => (),
    }
    make_values_matrix(
        ref :dict, :config, :tmp_signer_count, index: index + 1_usize, ref :tmp_arr, ref :matrix
    );
}

fn make_values_dict(
    data_packages: @Array<DataPackage>, config: Config, index: usize, ref dict: Felt252Dict<felt252>
) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == data_packages.len()) {
        return ();
    }

    let data_package = *data_packages[index];
    let signer_index = config.validate_signer(data_package);

    match signer_index {
        Option::Some(index) => insert_data_point_values(
            data_points: data_package.data_points,
            :config,
            signer_index: index,
            tmp_signer_count: data_packages.len(),
            index: 0_usize,
            ref :dict
        ),
        Option::None(()) => (),
    }
    make_values_dict(:data_packages, :config, index: index + 1_usize, ref :dict)
}

fn insert_data_point_values(
    data_points: @Array<DataPoint>,
    config: Config,
    signer_index: usize,
    tmp_signer_count: usize,
    index: usize,
    ref dict: Felt252Dict<felt252>
) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == data_points.len()) {
        return ();
    }

    let data_point = *data_points[index];
    let index_in_array = config
        .index_in_array(feed_id: data_point.feed_id, :signer_index, :tmp_signer_count);

    match index_in_array {
        Option::Some(x) => dict.insert(u32_to_felt252(x), data_point.value),
        Option::None(()) => (),
    }

    insert_data_point_values(
        :data_points, :config, :signer_index, :tmp_signer_count, index: index + 1_usize, ref :dict
    )
}

fn get_min_timestamp(data_packages: @Array<DataPackage>, index: usize, acc: felt252) -> felt252 {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == data_packages.len()) {
        return acc;
    }

    let value = if (*data_packages[index].timestamp < acc) {
        *data_packages[index].timestamp
    } else {
        acc
    };

    get_min_timestamp(:data_packages, index: index + 1, acc: value)
}
