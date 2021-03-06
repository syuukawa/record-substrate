import React from 'react';
require('semantic-ui-css/semantic.min.css');
import { Icon, Accordion, List, Checkbox, Label, Header, Segment, Divider, Button } from 'semantic-ui-react';
import { Bond, TransformBond } from 'oo7';
import { ReactiveComponent, If, Rspan } from 'oo7-react';
import {
	calls, runtime, chain, system, runtimeUp, ss58Decode, ss58Encode, pretty,
	addressBook, secretStore, metadata, nodeService, bytesToHex, hexToBytes, AccountId
} from 'oo7-substrate';
import Identicon from 'polkadot-identicon';
import { AccountIdBond, SignerBond } from './AccountIdBond.jsx';
import { BalanceBond } from './BalanceBond.jsx';
import { InputBond } from './InputBond.jsx';
import { TransactButton } from './TransactButton.jsx';
import { FileUploadBond } from './FileUploadBond.jsx';
import { StakingStatusLabel } from './StakingStatusLabel';
import { WalletList, SecretItem } from './WalletList';
import { AddressBookList } from './AddressBookList';
import { TransformBondButton } from './TransformBondButton';
import { Pretty } from './Pretty';

//001-
import { KittyCards } from './KittyCards'
import { KittyCardsOwned } from './KittyCardsOwned'

export class App extends ReactiveComponent {
	constructor() {
		super([], { ensureRuntime: runtimeUp })

		// For debug only.
		window.runtime = runtime;
		window.secretStore = secretStore;
		window.addressBook = addressBook;
		window.chain = chain;
		window.calls = calls;
		window.system = system;
		window.that = this;
		window.metadata = metadata;

		//002-
		addCodecTransform('Kitty<Hash,Balance>', { 
			id: 'Hash',
			dna: 'Hash',
			price: 'Balance',
			gen: 'u64'
		});
	}

	readyRender() {
		return (<div>
			<Heading />
			<WalletSegment />
			<Divider hidden />
			<AddressBookSegment />
			<Divider hidden />
			<FundingSegment />
			<Divider hidden />
			<UpgradeSegment />
			<Divider hidden />
			<PokeSegment />
			<Divider hidden />
			<TransactionsSegment />
			<Divider hidden />
			<SubstratekittiesSegment /> 
			<Divider hidden />
			<SetPriceSubstratekittiesSegment/>
			<Divider hidden />
			<BuySubstratekittiesSegment/>
			<Divider hidden />
			<TransferSubstratekittiesSegment/>
			<Divider hidden />
			<AuctionSubstratekittiesSegment/>
			<Divider hidden />
			<BidSubstratekittiesSegment/>
			<Divider hidden />
			<BreedSubstratekittiesSegment/>
		</div>);
	}
}

class Heading extends React.Component {
	render() {
		return <div>
			<If
				condition={nodeService().status.map(x => !!x.connected)}
				then={<Label>Connected <Label.Detail>
					<Pretty className="value" value={nodeService().status.sub('connected')} />
				</Label.Detail></Label>}
				else={<Label>Not connected</Label>}
			/>
			<Label>Name <Label.Detail>
				<Pretty className="value" value={system.name} /> v<Pretty className="value" value={system.version} />
			</Label.Detail></Label>
			<Label>Chain <Label.Detail>
				<Pretty className="value" value={system.chain} />
			</Label.Detail></Label>
			<Label>Runtime <Label.Detail>
				<Pretty className="value" value={runtime.version.specName} /> v<Pretty className="value" value={runtime.version.specVersion} /> (
					<Pretty className="value" value={runtime.version.implName} /> v<Pretty className="value" value={runtime.version.implVersion} />
				)
			</Label.Detail></Label>
			<Label>Height <Label.Detail>
				<Pretty className="value" value={chain.height} /> (with <Pretty className="value" value={chain.lag} /> lag)
			</Label.Detail></Label>
			<Label>Authorities <Label.Detail>
				<Rspan className="value">{
					runtime.core.authorities.mapEach((a, i) => <Identicon key={bytesToHex(a) + i} account={a} size={16} />)
				}</Rspan>
			</Label.Detail></Label>
			<Label>Total issuance <Label.Detail>
				<Pretty className="value" value={runtime.balances.totalIssuance} />
			</Label.Detail></Label>
		</div>
	}
}

class WalletSegment extends React.Component {
	constructor() {
		super()
		this.seed = new Bond;
		this.seedAccount = this.seed.map(s => s ? secretStore().accountFromPhrase(s) : undefined)
		this.seedAccount.use()
		this.name = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }}>
			<Header as='h2'>
				<Icon name='key' />
				<Header.Content>
					Wallet
					<Header.Subheader>Manage your secret keys</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>seed</div>
				<InputBond
					bond={this.seed}
					reversible
					placeholder='Some seed for this key'
					validator={n => n || null}
					action={<Button content="Another" onClick={() => this.seed.trigger(secretStore().generateMnemonic())} />}
					iconPosition='left'
					icon={<i style={{ opacity: 1 }} className='icon'><Identicon account={this.seedAccount} size={28} style={{ marginTop: '5px' }} /></i>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>name</div>
				<InputBond
					bond={this.name}
					placeholder='A name for this key'
					validator={n => n ? secretStore().map(ss => ss.byName[n] ? null : n) : null}
					action={<TransformBondButton
						content='Create'
						transform={(name, seed) => secretStore().submit(seed, name)}
						args={[this.name, this.seed]}
						immediate
					/>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<WalletList />
			</div>
		</Segment>
	}
}

class AddressBookSegment extends React.Component {
	constructor() {
		super()
		this.nick = new Bond
		this.lookup = new Bond
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='search' />
				<Header.Content>
					Address Book
					<Header.Subheader>Inspect the status of any account and name it for later use</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>lookup account</div>
				<AccountIdBond bond={this.lookup} />
				<If condition={this.lookup.ready()} then={
					<div>
						<Label>Balance
							<Label.Detail>
								<Pretty value={runtime.balances.balance(this.lookup)} />
							</Label.Detail>
						</Label>
						<Label>Nonce
							<Label.Detail>
								<Pretty value={runtime.system.accountNonce(this.lookup)} />
							</Label.Detail>
						</Label>
						<If condition={runtime.indices.tryIndex(this.lookup, null).map(x => x !== null)} then={
							<Label>Short-form
								<Label.Detail>
									<Rspan>{runtime.indices.tryIndex(this.lookup).map(i => ss58Encode(i) + ` (index ${i})`)}</Rspan>
								</Label.Detail>
							</Label>
						} />
						<Label>Address
							<Label.Detail>
								<Pretty value={this.lookup} />
							</Label.Detail>
						</Label>
					</div>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>name</div>
				<InputBond
					bond={this.nick}
					placeholder='A name for this address'
					validator={n => n ? addressBook().map(ss => ss.byName[n] ? null : n) : null}
					action={<TransformBondButton
						content='Add'
						transform={(name, account) => { 
							addressBook().submit(account, name); return true }}
						args={[this.nick, this.lookup]}
						immediate
					/>}
				/>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<AddressBookList />
			</div>
		</Segment>
	}
}

class FundingSegment extends React.Component {
	constructor() {
		super()

		this.source = new Bond;
		this.amount = new Bond;
		this.destination = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Send Funds
					<Header.Subheader>Send funds from your account to another</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>from</div>
				<SignerBond bond={this.source} />
				<If condition={this.source.ready()} then={<span>
					<Label>Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.source)} />
						</Label.Detail>
					</Label>
					<Label>Nonce
						<Label.Detail>
							<Pretty value={runtime.system.accountNonce(this.source)} />
						</Label.Detail>
					</Label>
				</span>} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>to</div>
				<AccountIdBond bond={this.destination} />
				<If condition={this.destination.ready()} then={
					<Label>Balance
						<Label.Detail>
							<Pretty value={runtime.balances.balance(this.destination)} />
						</Label.Detail>
					</Label>
				} />
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>amount</div>
				<BalanceBond bond={this.amount} />
			</div>
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.source),
					call: calls.balances.transfer(runtime.indices.tryIndex(this.destination), this.amount),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

class UpgradeSegment extends React.Component {
	constructor() {
		super()
		this.conditionBond = runtime.metadata.map(m =>
			m.modules && m.modules.some(o => o.name === 'sudo')
			|| m.modules.some(o => o.name === 'upgrade_key')
		)
		this.runtime = new Bond
	}
	render() {
		return <If condition={this.conditionBond} then={
			<Segment style={{ margin: '1em' }} padded>
				<Header as='h2'>
					<Icon name='search' />
					<Header.Content>
						Runtime Upgrade
						<Header.Subheader>Upgrade the runtime using the UpgradeKey module</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{ paddingBottom: '1em' }}></div>
				<FileUploadBond bond={this.runtime} content='Select Runtime' />
				<TransactButton
					content="Upgrade"
					icon='warning'
					tx={{
						sender: runtime.sudo
							? runtime.sudo.key
							: runtime.upgrade_key.key,
						call: calls.sudo
							? calls.sudo.sudo(calls.consensus.setCode(this.runtime))
							: calls.upgrade_key.upgrade(this.runtime)
					}}
				/>
			</Segment>
		} />
	}
}

class PokeSegment extends React.Component {
	constructor () {
		super()
		this.storageKey = new Bond;
		this.storageValue = new Bond;
	}
	render () {
		return <If condition={runtime.metadata.map(m => m.modules && m.modules.some(o => o.name === 'sudo'))} then={
			<Segment style={{margin: '1em'}} padded>
				<Header as='h2'>
					<Icon name='search' />
					<Header.Content>
						Poke
						<Header.Subheader>Set a particular key of storage to a particular value</Header.Subheader>
					</Header.Content>
				</Header>
				<div style={{paddingBottom: '1em'}}></div>
				<InputBond bond={this.storageKey} placeholder='Storage key e.g. 0xf00baa' />
				<InputBond bond={this.storageValue} placeholder='Storage value e.g. 0xf00baa' />
				<TransactButton
					content="Poke"
					icon='warning'
					tx={{
						sender: runtime.sudo ? runtime.sudo.key : null,
						call: calls.sudo ? calls.sudo.sudo(calls.consensus.setStorage([[this.storageKey.map(hexToBytes), this.storageValue.map(hexToBytes)]])) : null
					}}
				/>
			</Segment>
		}/>		
	}
}

class TransactionsSegment extends React.Component {
	constructor () {
		super()

		this.txhex = new Bond
	}

	render () {
		return <Segment style={{margin: '1em'}} padded>
			<Header as='h2'>
				<Icon name='certificate' />
				<Header.Content>
					Transactions
					<Header.Subheader>Send custom transactions</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>Custom Transaction Data</div>
					<InputBond bond={this.txhex}/>
				</div>
				<TransactButton tx={this.txhex.map(hexToBytes)} content="Publish" icon="sign in" />
			</div>
		</Segment>
	}
}

//003-
class SubstratekittiesSegment extends React.Component {
    constructor() {
        super()

		this.skAccount = new Bond
    }

    render() {
        return <Segment style={{ margin: '1em' }} padded>
            <Header as='h2'>
                <Icon name='paw' />
                <Header.Content>
                    Substrate Kitties
                <Header.Subheader>There are <Pretty value={runtime.substratekitties.allKittiesCount} /> kitties purring.</Header.Subheader>
                </Header.Content>
            </Header>
            <div style={{ paddingBottom: '1em' }}></div>
			
			{/* 004- */}
            <KittyCards count={runtime.substratekitties.allKittiesCount} />
            <div style={{ paddingBottom: '1em' }}></div>
            <SignerBond bond={this.skAccount} />
            <TransactButton
                content="Create Kitty"
                icon='paw'
                tx={{
                    sender: runtime.indices.tryIndex(this.skAccount),
                    call: calls.substratekitties.createKitty()
                }}
            />
        </Segment>
    }
}

//转移Kitty
class TransferSubstratekittiesSegment extends React.Component {
	constructor() {
		super()

		this.source = new Bond
		this.kittyId = new Bond
		this.destination = new Bond
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					transfer
					<Header.Subheader>transfer kitty from your account to another</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>from</div>
				<SignerBond bond={this.source} /> 
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>to</div>
				<AccountIdBond bond={this.destination} />
			</div>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>kittyId</div>
					<InputBond bond={this.kittyId}/>
				</div>
			</div>		
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.source),
					call: calls.substratekitties.transfer(this.destination, this.kittyId.map(hexToBytes)),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}


//设定Kitty的价格，售卖Kitty
class SetPriceSubstratekittiesSegment extends React.Component {
	constructor() {
		super()

		this.owner = new Bond;
		this.sellPrice = new Bond;
		this.kittyId = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Price
					<Header.Subheader>Set Sell Price for the Kitty</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>Owner</div>
				<SignerBond bond={this.owner} />
			</div>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>kittyId</div>
					<InputBond bond={this.kittyId}/>
				</div>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>sellPrice</div>
				<BalanceBond bond={this.sellPrice} />
			</div>
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.owner),
					call: calls.substratekitties.setPrice(this.kittyId.map(hexToBytes), this.sellPrice),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

//购买Kitty
class BuySubstratekittiesSegment extends React.Component {
	constructor() {
		super()

		this.buyer = new Bond;
		this.buyPrice = new Bond;
		this.kittyId = new Bond;
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Buy
					<Header.Subheader>Buy the Kitty</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>buyer</div>
				<SignerBond bond={this.buyer} />
			</div>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>kittyId</div>
					<InputBond bond={this.kittyId}/>
				</div>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>buyPrice</div>
				<BalanceBond bond={this.buyPrice} />
			</div>
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.buyer),
					call: calls.substratekitties.buyKitty(this.kittyId.map(hexToBytes), this.buyPrice),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

class AuctionSubstratekittiesSegment extends React.Component {
	constructor() {
		super()

		this.owner = new Bond
		this.minBid = new Bond
		this.kittyId = new Bond
		// this.expriy = new Bond
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Auctions
					<Header.Subheader>Set Auctions for the Kitty</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>Owner</div>
				<SignerBond bond={this.owner} />
			</div>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>kittyId</div>
					<InputBond bond={this.kittyId}/>
				</div>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>minBid</div>
				<BalanceBond bond={this.minBid} />
			</div>
			{/* <div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>expriy</div>
				<InputBond bond={this.expriy} />
			</div> */}
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.owner),
					call: calls.substratekitties.predefinedCreateAuction(this.kittyId.map(hexToBytes), this.minBid),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

class BidSubstratekittiesSegment extends React.Component {
	constructor() {
		super()

		this.bidner = new Bond
		this.bidBalance = new Bond
		this.kittyId = new Bond
		// this.expriy = new Bond
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Biding
					<Header.Subheader>Biding for the Kitty</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>bidner</div>
				<SignerBond bond={this.bidner} />
			</div>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>kittyId</div>
					<InputBond bond={this.kittyId}/>
				</div>
			</div>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>bidBalance</div>
				<BalanceBond bond={this.bidBalance} />
			</div>
			{/* <div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>expriy</div>
				<InputBond bond={this.expriy} />
			</div> */}
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.bidner),
					call: calls.substratekitties.bidAuction(this.kittyId.map(hexToBytes), this.bidBalance),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}

class BreedSubstratekittiesSegment extends React.Component {
	constructor() {
		super()

		this.owner = new Bond
		this.kittyId1 = new Bond
		this.kittyId2 = new Bond
		// this.expriy = new Bond
	}
	render() {
		return <Segment style={{ margin: '1em' }} padded>
			<Header as='h2'>
				<Icon name='send' />
				<Header.Content>
					Breed
					<Header.Subheader>Breed Kitty</Header.Subheader>
				</Header.Content>
			</Header>
			<div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>owner</div>
				<SignerBond bond={this.owner} />
			</div>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>kittyId1</div>
					<InputBond bond={this.kittyId1}/>
				</div>
			</div>
			<div style={{paddingBottom: '1em'}}>
				<div style={{paddingBottom: '1em'}}>
					<div style={{fontSize: 'small'}}>kittyId2</div>
					<InputBond bond={this.kittyId2}/>
				</div>
			</div>
			{/* <div style={{ paddingBottom: '1em' }}>
				<div style={{ fontSize: 'small' }}>expriy</div>
				<InputBond bond={this.expriy} />
			</div> */}
			<TransactButton
				content="Send"
				icon='send'
				tx={{
					sender: runtime.indices.tryIndex(this.owner),
					call: calls.substratekitties.breedKitty(this.kittyId1.map(hexToBytes), this.kittyId2.map(hexToBytes)),
					compact: false,
					longevity: true
				}}
			/>
		</Segment>
	}
}