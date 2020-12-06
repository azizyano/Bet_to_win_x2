import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import {
  Card,
  Typography,
} from '@material-ui/core';

import { colors } from '../../theme'
import flip from '../../assets/flip.png';
import ColoredLoader from '../loader/coloredLoader'
//import Loader from '../loader'
import Snackbar from '../snackbar'

// Added
import config from "../../config";
import Store from "../../stores";
const store = Store.store
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
  root: {
    flex: 1,
    display: 'flex',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'column',
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
    }
  },
  card: {
    flex: '1',
    height: '25vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    cursor: 'pointer',
    borderRadius: '0px',
    transition: 'background-color 0.2s linear',
    [theme.breakpoints.up('sm')]: {
      height: '100vh',
      minWidth: '20%',
      minHeight: '50vh',
    }
  },
  gradient: {
    backgroundColor: colors.darkBlue,
    '&:hover': {
      backgroundColor: '#00AEE9',
      '& .title': {
        color: colors.white,
      },
      '& .icon': {
        color: colors.white
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
  title: {
    padding: '24px 0 12px 0',
    [theme.breakpoints.up('sm')]: {
      paddingBottom: '12px'
    }
  },
  subTitle: {
    padding: '0 0 12px 0',
    fontSize: '12px',
    [theme.breakpoints.up('sm')]: {
      paddingBottom: '12px'
    }
  },
  icon: {
    fontSize: '60px',
    [theme.breakpoints.up('sm')]: {
      fontSize: '100px',
    }
  },
  link: {
    textDecoration: 'none'
  }
});

class Home extends Component {
  
  constructor(props) {
    super(props)

    this.state = {
      snackbarMessage: null,
      snackbarType: null,
      loading: false,
      amount: null,
    }
    this.onChange = this.onChange.bind(this);
  }
  onChange(value) {
    this.setState({amount: value});
  }

  render() {
    const { classes } = this.props;

    const {
      snackbarMessage,
      loading,
      amount
    } = this.state

    return (
      <div className={ classes.root }>
        <Card className={ `${classes.card} ${classes.gradient}` } >
        <Typography variant={'h6'} className={ `${classes.title} title` }>Minimun bet is 1$ of ONE token</Typography>
        <img alt='Harmony logo' src={flip} />
        <input
         className={ `${classes.gradient} title` }
         
         type="number"
         placeholder="bet amount..."
         onChange={(e) => this.onChange(e.target.value)}
         required
          />
          <Typography variant={'h8'} className={ `${classes.title} title` }>If the amount equivalent less than 1$ you will got a errur message</Typography>
          <button
            type="submit"
            className={ `${classes.gradient}` }
            onClick={(event) => {
              event.preventDefault()
              this.makeBet(0, amount)
            }}>
            <Typography variant={'h3'} className={ `${classes.title} title` }>LOW</Typography>
          </button>
          &nbsp;&nbsp;&nbsp;
          <button
            type="submit"
            className={ `${classes.gradient}` }
            onClick={(event) => {
              event.preventDefault()
              this.makeBet(1, amount)
            }}>
            <Typography variant={'h3'} className={ `${classes.title} title` }>HIGH</Typography>
          </button>
          <Typography variant={'h6'} className={ `${classes.title} title` }>Good luck!</Typography>
        </Card>
        { loading && <ColoredLoader /> }
        { snackbarMessage && this.renderSnackbar() }
      </div>
    )
  };

  nav = (screen) => {
    this.props.history.push(screen)
  }

  renderSnackbar = () => {
    var {
      snackbarType,
      snackbarMessage
    } = this.state
    return <Snackbar type={ snackbarType } message={ snackbarMessage } open={true}/>
  };


  makeBet = async (bet, amount) => {
    const wallet = store.getWallet();
    const contractJson = require('../../abi/HarmoGame.json');
    let contract = hmy.contracts.createContract(contractJson.abi, config.addresses.hg);
    contract = wallet.attachToContract(contract)
    var randomSeed = Math.floor(Math.random() * Math.floor(1e9))
    
    this.setState({ snackbarMessage: null, snackbarType: null, loading: true })
    const amountToWie = amount * 10**18
    await contract.methods.game(bet, randomSeed).send({gasPrice: 1000000000, gasLimit: 210000, value: amountToWie })
    
    .then((res) => {
      if (res.status === 'called' || res.status === 'call') {
        const url = `${hmy.explorerUrl}/tx/${res.transaction.receipt.transactionHash}`
        this.setState({ snackbarMessage: url, snackbarType: "Hash", loading: false })
        
      } else {
        this.setState({ snackbarMessage: "An error occurred :(. Please try again!", snackbarType: "Error", loading: false })
      }
       
    })
    .catch((err) => {
      this.setState({ snackbarMessage: "An error occurred :(. Please try again!", snackbarType: "Error", loading: false })
    });
  }

}

export default (withRouter(withStyles(styles)(Home)));
