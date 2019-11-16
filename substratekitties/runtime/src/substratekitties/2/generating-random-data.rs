// ACTION: Add `support::StorageValue` and `support::ensure` to the imports
use support::{decl_storage, decl_module, StorageMap, StorageValue, 
                dispatch::Result, ensure};
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

pub trait Trait: balances::Trait {}

decl_storage! {
    trait Store for Module<T: Trait> as KittyStorage {
        // ACTION: Add two new kitty storage items: 
        //         - `Kitties` which maps a `T::Hash` to a `Kitty<T::Hash, T::Balance>`
        //         - `KittyOwner` which maps a `T::Hash` to an `Option<T::AccountId>`
        Kitties get(kitty): map T::Hash => Kitty<T::Hash, T::Balance>;
        KittyOwner get(owner_of): map T::Hash => Option<T::AccountId>;

        // ACTION: Update `OwnedKitty` to store a `T::Hash`
        OwnedKitty get(kitty_of_owner): map T::AccountId => T::Hash;

        // ACTION: Add a `u64` value named `Nonce`
        Nonce : u64;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn create_kitty(origin) -> Result {
            let sender = ensure_signed(origin)?;

            // ACTION: Generate a `random_hash` using: 
            //         - `<system::Module<T>>::random_seed()`
            //         - `sender`
            //         - `Nonce`
            let nonce = <Nonce<T>>::get();
            let random_seed = <system::Module<T>>::random_seed();
            let random_hash = (random_seed, &sender, nonce).using_encoded(<T as system::Trait>::Hashing::hash);
            // ACTION: `ensure` our `random_hash` does not collide with an existing token
            ensure!(!<KittyOwner<T>>::exists(random_hash), "Kitty already exists"); //random_hash不存在
          
            // ACTION: Update our Kitty to use this `random_hash` as the `id` and the `dna`
            let new_kitty = Kitty {
                id: random_hash,
                dna: random_hash,
                price: <T::Balance as As<u64>>::sa(0),
                gen: 0,
            };

            // ACTION: `insert` the storage for `Kitties`, should point from our kitty's id to the `Kitty` object
            <Kitties<T>>::insert(random_hash, &new_kitty);
            // ACTION: `insert` the storage for `KittyOwner`, should point from our kitty's id to the owner
            <KittyOwner<T>>::insert(random_hash, &sender); //&sender是sender的引用
            // ACTION: Update the `OwnedKitty` storage below to store the kitty's id rather than the `Kitty` object
            <OwnedKitty<T>>::insert(&sender, random_hash);

            // ACTION: `mutate` the nonce to increment it by 1
            //   HINT: You can pass the closure `(|n| *n += 1)` into `mutate`
            <Nonce<T>>::mutate(|n| *n += 1);

            Ok(())
        }
    }
}

