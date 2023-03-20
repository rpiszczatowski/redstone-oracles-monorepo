%lang starknet

from redstone.utils.array import array_new

@external
func test_array_new{syscall_ptr: felt*, range_check_ptr}() {
    let r = array_new(len=3);
    assert r.len = 3;

    assert r.ptr[0] = 1;
    assert r.ptr[1] = 2;
    assert r.ptr[2] = 3;

    return ();
}
