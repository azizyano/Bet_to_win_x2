import config from "../config";
import {
  CONFIGURE,
  CONFIGURE_RETURNED,
} from '../constants';

import { MathWallet } from '../wallets/mathwallet';
import { OneWallet } from '../wallets/onewallet';
import { Hmy } from '../blockchain';

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {

    const hmy = new Hmy(config.network);
    const mathwallet = new MathWallet(config.network, hmy.client);
    const onewallet = new OneWallet(config.network, hmy.client);

    this.store = {
      votingStatus: false,
      governanceContractVersion: 2,
      currentBlock: 0,
      universalGasPrice: '70',
      account: {},
      web3: null,
      hmy: hmy,
      onewallet: onewallet,
      mathwallet: mathwallet,
      wallet: null,
      connectorsByName: {
        OneWallet: onewallet,
        MathWallet: mathwallet,
      },
      
      web3context: null,
      languages: [
        {
          language: 'English',
          code: 'en'
        }
      ]
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE:
            this.configure(payload);
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    return emitter.emit('StoreUpdated');
  };

  getWallet() {
    var wallet = null;

    const wallets = [
      this.getStore('wallet'),
      this.getStore('onewallet'),
      this.getStore('mathwallet')
    ];

    for (const potentialWallet of wallets) {
      if (potentialWallet && (potentialWallet.isAuthorized || potentialWallet.base16Address || potentialWallet.address)) {
        wallet = potentialWallet;
        this.setStore({ wallet: wallet, account: { address: wallet.base16Address, bech32Address: wallet.address } });
        break;
      }
    }

    return wallet;
  }

  configure = async () => {
    const hmy = store.getStore('hmy');
    let currentBlock = await hmy.getBlockNumber();

    store.setStore({ currentBlock: currentBlock });

    window.setTimeout(() => {
      emitter.emit(CONFIGURE_RETURNED)
    }, 100)
  }

  

}

const store = new Store();
const stores = {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
}
export default stores;
