use support::{decl_storage, decl_module, StorageValue, StorageMap,
    dispatch::Result, ensure, decl_event};
use system::ensure_signed;
use runtime_primitives::traits::{As, Hash};
use parity_codec::{Encode, Decode};

#[derive(Encode, Decode, Default, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Kitty<Hash, Balance> {
    id: Hash,
    dna: Hash,
    price: Balance,
    gen: u64,
}

pub trait Trait: balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_event!(
    pub enum Event<T>
    where
        <T as system::Trait>::AccountId,
        <T as system::Trait>::Hash
    {
        Created(AccountId, Hash),
    }
);

decl_storage! {
    trait Store for Module<T: Trait> as KittyStorage {
        Kitties get(kitty): map T::Hash => Kitty<T::Hash, T::Balance>;
        KittyOwner get(owner_of): map T::Hash => Option<T::AccountId>;

        // ACTION: Create new storage items to globally track all kitties: 
        //         - `AllKittiesArray` which is a `map` from `u64` to `T::Hash`, add a getter function for this
        //         - `AllKittiesCount` which is a `u64`, add a getter function for this
        //         - `AllKittiesIndex` which is a `map` from `T::Hash` to `u64`
        AllKittiesCount get(all_kitties_count): u64; //所有Kitty的数量
        AllKittiesArray get(all_kitties_array): map u64 => T::Hash; //index对应kitty_id
        AllKittiesIndex get(all_kitties_index): map T::Hash => u64; //kitty_id对应的index

        OwnedKitty get(kitty_of_owner): map T::AccountId => T::Hash;

        Nonce: u64;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event<T>() = default;

        fn create_kitty(origin) -> Result {
            let sender = ensure_signed(origin)?;

            // ACTION: Get the current `AllKittiesCount` value and store it in `all_kitties_count`
            // ACTION: Create a `new_all_kitties_count` by doing a `checked_add()` to increment `all_kitties_count`
            //      REMINDER: Return an `Err()` if there is an overflow
            let all_kitties_count = Self::all_kitties_count();
            let new_all_kitties_count = all_kitties_count.checked_add(1).ok_or("Overflow adding a kitty")?;

            let nonce = <Nonce<T>>::get();
            let random_hash = (<system::Module<T>>::random_seed(), &sender, nonce)
                .using_encoded(<T as system::Trait>::Hashing::hash);

            ensure!(!<KittyOwner<T>>::exists(random_hash), "Kitty already exists");

            let new_kitty = Kitty {
                id: random_hash,
                dna: random_hash,
                price: <T::Balance as As<u64>>::sa(0),
                gen: 0,
            };

            <Kitties<T>>::insert(random_hash, new_kitty);
            <KittyOwner<T>>::insert(random_hash, &sender);

            // ACTION: Update the storage for the global kitty tracking
            //         - `AllKittiesArray` should use the `all_kitties_count` (remember `index` is `count - 1`)
            //         - `AllKittiesCount` should use `new_all_kitties_count`
            //         - `AllKittiesIndex` should use `all_kitties_count`
            <AllKittiesCount<T>>::put(new_all_kitties_count);
            <AllKittiesArray<T>>::insert(all_kitties_count, random_hash);
            <AllKittiesIndex<T>>::insert(random_hash, all_kitties_count);

            <OwnedKitty<T>>::insert(&sender, random_hash);

            <Nonce<T>>::mutate(|n| *n += 1);

            Self::deposit_event(RawEvent::Created(sender, random_hash));

            Ok(())
        }
    }
}