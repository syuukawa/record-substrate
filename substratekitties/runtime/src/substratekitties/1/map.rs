use support::{decl_storage, decl_module, StorageValue, StorageMap, dispatch::Result};
use system::ensure_signed;

pub trait Trait: system::Trait {}

decl_storage! {
    trait Store for Module<T: Trait> as Substratekitties {

        // Kitty的数量
        KittyCount get(kitty_count): u32;

        //拥有的Kitty的数量
        OwnedKittyCount get(owned_kitty_count): map T::AccountId=> u32;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        // Declare public functions here
        // 定义功能函数
        fn set_function(origin, count: u32) -> Result {
            let _sender = ensure_signed(origin)?;

            <KittyCount<T>>::put(count);
            <OwnedKittyCount<T>>::insert(_sender,count);

            Ok(())
        }

    }
}