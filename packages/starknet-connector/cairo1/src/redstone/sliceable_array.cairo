use array::ArrayTrait;
use array::array_slice;
use array::ArrayTCloneImpl;

use option::OptionTrait;


struct ArraySlice<T> {
    head: @Array<T>,
    tail: @Array<T>,
}


impl ArraySliceCopy<T, impl TCopy: Copy<T>> of Copy<ArraySlice<T>>;
impl ArraySliceDrop<T, impl TDrop: Drop<T>> of Drop<ArraySlice<T>>;
impl ArrayCopy<T, impl TCopy: Copy<T>> of Copy<Array<T>>;

/// TODO: rename to SliceableTrait & move to other file
trait SliceableArrayTrait<T> {
    fn slice_tail_offset(self: @Array<T>, length: usize, offset: usize) -> ArraySlice<T>;
    fn slice_tail(self: @Array<T>, length: usize) -> ArraySlice<T>;
    fn copy(self: @Array<T>) -> Array<T>;
}


impl SliceableArray<T, impl TDrop: Drop<T>, impl TCopy: Copy<T>> of SliceableArrayTrait<T> {
    fn slice_tail_offset(self: @Array<T>, length: usize, offset: usize) -> ArraySlice<T> {
        let head_size = self.len() - offset - length;
        if (head_size <= 0_usize) {
            let head: Array<T> = ArrayTrait::new();
            return ArraySlice { head: @head, tail: self };
        }

        let head = array_slice(self, 0_usize, head_size).unwrap();
        let mut tail = array_slice(self, head_size, length - 1_usize).unwrap().copy();
        tail.append(*self[head_size + length - 1_usize]);
        // array_slice crashes when head_size + length is the last index. 
        // https://github.com/starkware-libs/cairo/issues/2703

        ArraySlice { head, tail: @tail }
    }

    fn slice_tail(self: @Array<T>, length: usize) -> ArraySlice<T> {
        self.slice_tail_offset(length, 0_usize)
    }


    fn copy(self: @Array<T>) -> Array<T> {
        let mut res: Array<T> = ArrayTrait::new();

        array_copy(self, 0_usize, ref res);

        res
    }
}


fn array_copy<T, impl TDrop: Drop<T>, impl TCopy: Copy<T>>(
    arr: @Array<T>, index: usize, ref res: Array<T>
) {
    if (index == arr.len()) {
        return ();
    }

    res.append(*arr[index]);

    array_copy(arr, index + 1_usize, ref res)
}
// impl DropFeltSnapshot of Drop::<@felt252>;

// impl ArrayDrop<T, impl TDrop: Drop<T>> of Drop<Array<T>>;

// let mut arr = array_new();
// arr.append(0x00_u8);
// arr.append(0x01_u8);
// arr.append(0x02_u8);
// arr.append(0x03_u8);
// arr.append(0x04_u8);
// arr.append(0x05_u8);
// arr.append(0x06_u8);
// arr.append(0x07_u8);
// arr.append(0x08_u8);
// arr.append(0x09_u8);

// let x = arr.slice_tail(5_usize);
// u32_to_felt252(x.head.len()).print();
// u32_to_felt252(x.tail.len()).print();


