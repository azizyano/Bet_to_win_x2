import React, { Component } from "react";
import {
  Typography,
  Button
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { colors } from "../../theme";
import config from "../../config";
import {
  CONNECTION_DISCONNECTED,
} from '../../constants'

import Store from "../../stores";
const store = Store.store
const emitter = Store.emitter
require("dotenv").config();
const { Harmony } = require("@harmony-js/core");
const { ChainID, ChainType } = require("@harmony-js/utils");
const hmy = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  "https://api.s0.b.hmny.io",
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);

const styles = theme => ({
  headerContainer: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 999
  },
  actionButton: {
    background: '#bcecfd',
    color: '#00AEE9',
    borderColor: '#00AEE9',
    '&:hover': {
      color: `${colors.white} !important`
    }
  },
  gradient: {
    backgroundColor: colors.white,
    '&:hover': {
      backgroundColor: '#00AEE9',
      '& .title': {
        color: `${colors.white} !important`
      },
      '& .icon': {
        color: `${colors.white} !important`
      }
    },
    '& .title': {
      color: '#00AEE9',
    },
    '& .icon': {
      color: '#00AEE9'
    },
  },
  green: {
    backgroundColor: colors.white,
    '&:hover': {
      backgroundColor: colors.compoundGreen,
      '& .title': {
        color: colors.white,
      },
      '& .icon': {
        color: colors.white
      }
    },
    '& .title': {
      color: colors.compoundGreen,
    },
    '& .icon': {
      color: colors.compoundGreen
    },
  },
})

class Header extends Component {

  constructor(props) {
    super()

    this.state = {
      price: null,
      loading: false,
    }
    
  }


  getBalancesReturned = () => {
    this.setState({ loading: false })
  }
  
  render() {
    
    const { classes } = this.props
    const { loading, price } = this.state
    
    return (
      <div className={ classes.headerContainer }>
        Update the price  :
          <Button
          type="submit"
          className={ `${classes.gradient}` }
          onClick={(event) => {
            event.preventDefault()
            this.gitprice()
          }}
          >
          <Typography>ONE price { price } USD</Typography>
        </Button>
        <Button
          className={ classes.gradient }
          variant="outlined"
          color="primary"
          onClick={ this.signoutClicked }
          disabled={ loading }
          >
          <Typography>Disconnect</Typography>
        </Button>
      </div>
    );
  }

  signoutClicked = () => {
    const wallet = store.getWallet();
    
    if (wallet) {
      wallet.signOut().then(() => {
        store.setStore({ wallet: null, account: null })
        emitter.emit(CONNECTION_DISCONNECTED)
      });
    }
  }
  gitprice = async () => {
    this.setState({ price: null, loading: false })
    const contractJson = require('../../abi/HarmoGame.json');
    let contract = hmy.contracts.createContract(contractJson.abi, config.addresses.hg);
    const val1 = await contract.methods.getPrice().call()
    const val2 = val1.toString()
    const val = val2/10**18
    this.setState({ price: val, loading: false });
  }
}

export default (withStyles(styles)(Header));
