from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.dict import dict_read
from starkware.cairo.common.dict_access import DictAccess
from starkware.cairo.common.math import unsigned_div_rem
from starkware.cairo.common.serialize import serialize_word

from redstone.utils.array import ARRAY_UNKNOWN_INDEX, Array, array_index, array_new, serialize_array
from redstone.utils.dict import DICT_UNKNOWN_VALUE
from redstone.config import Config

struct Results {
    ptr: Array*,
    len: felt,
}

func make_results{range_check_ptr, dict_ptr: DictAccess*}(config: Config) -> Results {
    alloc_locals;

    local results: Results;
    let (ptr: Array*) = alloc();
    assert results.ptr = ptr;
    assert results.len = config.allowed_signer_addresses.len;

    let empty_arr = array_new(len=0);

    _make_results(
        config=config,
        last_price_index=ARRAY_UNKNOWN_INDEX,
        signer_count_acc=0,
        price_count_acc=0,
        price_arr_acc=empty_arr,
        index=0,
        res=results,
    );

    return results;
}

func _make_results{range_check_ptr, dict_ptr: DictAccess*}(
    config: Config,
    last_price_index: felt,
    signer_count_acc: felt,
    price_count_acc: felt,
    price_arr_acc: Array,
    index: felt,
    res: Results,
) {
    alloc_locals;

    let (price_index, signer_index) = unsigned_div_rem(index, config.requested_feed_ids.len);

    local signer_count;
    local price_count;
    local price_arr: Array;
    let empty_arr = array_new(len=config.allowed_signer_addresses.len);
    if (price_index != last_price_index) {
        with_attr error_message(
                "Unique signer count treshold {config.signer_count_treshold} for {price_index} not achieved") {
            // assert_le(config.signer_count_treshold, signer_count_acc);
        }

        if (last_price_index != ARRAY_UNKNOWN_INDEX) {
            local tmp_arr: Array = Array(ptr=price_arr_acc.ptr, len=price_count_acc);
            assert res.ptr[last_price_index] = tmp_arr;
        }

        assert signer_count = 0;
        assert price_count = 0;
        assert price_arr = empty_arr;
    } else {
        assert signer_count = signer_count_acc + 1;
        assert price_count = price_count_acc;
        assert price_arr = price_arr_acc;
    }

    if (index == config.allowed_signer_addresses.len * config.requested_feed_ids.len) {
        return ();
    }

    let (value) = dict_read(index);

    local price_count_inc;
    if (value != DICT_UNKNOWN_VALUE) {
        assert price_arr.ptr[price_count] = value;
        assert price_count_inc = 1;
    } else {
        assert price_count_inc = 0;
    }

    return _make_results(
        config=config,
        last_price_index=price_index,
        signer_count_acc=signer_count,
        price_count_acc=price_count_inc + price_count,
        price_arr_acc=price_arr,
        index=index + 1,
        res=res,
    );
}

func serialize_results_dic{range_check_ptr, output_ptr: felt*, dict_ptr: DictAccess*}(
    config: Config, index: felt
) {
    if (index == config.allowed_signer_addresses.len * config.requested_feed_ids.len) {
        return ();
    }

    let (price_index, signer_index) = unsigned_div_rem(index, config.requested_feed_ids.len);
    serialize_word(price_index);
    serialize_word(signer_index);

    let (value) = dict_read(index);
    serialize_word(value);

    return serialize_results_dic(config=config, index=index + 1);
}

func serialize_results{output_ptr: felt*, range_check_ptr}(arr: Results, index: felt) {
    if (index == arr.len) {
        return ();
    }

    serialize_word(index);
    serialize_array(arr=arr.ptr[index], index=0);

    return serialize_results(arr=arr, index=index + 1);
}
