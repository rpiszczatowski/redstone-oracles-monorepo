from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.math import assert_nn
from starkware.cairo.common.alloc import alloc

from redstone.utils.array import (
    Array,
    array_slice_tail,
    array_slice_number,
    array_to_number,
    array_to_string,
)
from redstone.protocol.constants import DATA_FEED_ID_BS

struct DataPoint {
    value: felt,
    data_feed_id_arr: Array,
}

struct DataPointArray {
    ptr: DataPoint*,
    len: felt,
}

func get_data_points{range_check_ptr}(arr: Array, value_size: felt, count: felt) -> DataPointArray {
    alloc_locals;

    assert_nn(count);
    assert_nn(value_size - 1);

    let (ptr: DataPoint*) = alloc();
    local res: DataPointArray = DataPointArray(ptr=ptr, len=count);

    _get_data_points_rec(arr=arr, value_size=value_size, count=count, res=res);
    return res;
}

func _get_data_points_rec{range_check_ptr}(
    arr: Array, value_size: felt, count: felt, res: DataPointArray
) {
    alloc_locals;

    if (count == 0) {
        return ();
    }

    let (value_rest, value) = array_slice_number(arr=arr, len=value_size);
    let (data_feed_id_rest, data_feed_id_arr) = array_slice_tail(
        arr=value_rest, len=DATA_FEED_ID_BS
    );

    local dp: DataPoint = DataPoint(value=value, data_feed_id_arr=data_feed_id_arr);
    assert res.ptr[count - 1] = dp;

    return _get_data_points_rec(
        arr=data_feed_id_rest, value_size=value_size, count=count - 1, res=res
    );
}

func serialize_data_point_array{output_ptr: felt*, range_check_ptr}(
    arr: DataPointArray, index: felt
) {
    if (index == arr.len) {
        return ();
    }

    serialize_word(index);
    serialize_data_point(arr.ptr + index * DataPoint.SIZE);

    return serialize_data_point_array(arr=arr, index=index + 1);
}

func serialize_data_point{output_ptr: felt*, range_check_ptr}(dp: DataPoint*) {
    alloc_locals;

    array_to_string(dp.data_feed_id_arr);
    serialize_word([ap - 1]);
    serialize_word(dp.value);

    return ();
}
