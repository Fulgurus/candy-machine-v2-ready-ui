import { useEffect, useState } from "react";
import styled from "styled-components";
import confetti from "canvas-confetti";
import * as anchor from "@project-serum/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { GatewayProvider } from '@civic/solana-gateway-react';
import Countdown from "react-countdown";
import { Snackbar, Paper, LinearProgress, Chip } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { toDate, AlertState, getAtaForMint } from './utils';
import { MintButton } from './MintButton';
import ImageMapper from 'react-img-mapper';


//import{ HashLink } from 'react-router-hash-link';

import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintOneToken,
    CANDY_MACHINE_PROGRAM,
} from "./candy-machine";

const cluster = process.env.REACT_APP_SOLANA_NETWORK!.toString();
const decimals = process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS ? +process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS!.toString() : 9;
const splTokenName = process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME ? process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME.toString() : "TOKEN";

const WalletContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
`;

const WalletAmount = styled.div`
  color: black;
  width: auto;
  padding: 5px 5px 5px 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 22px;
  background-color: var(--main-text-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
`;

const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;

const ConnectButton = styled(WalletMultiButton)`
  border-radius: 18px !important;
  padding: 6px 16px;
  background-color: #4E44CE;
  margin: 0 auto;
`;

const NFT = styled(Paper)`
  
  padding: 5px 20px 20px 20px;
  flex: 1 1 auto;
  background-color: var(--card-background-color) !important;
  box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22) !important;
  hover: {
    background-color: "#efefef" !important;
  },
`;

const NFT3 = styled(Paper)`

  padding: 5px 20px 20px 20px;
  flex: auto;
  background-color: transparent !important;
  box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22) !important;
  border-color: white;
  border-style: solid;
`;

const NFT2 = styled(Paper)`
  
  padding: 5px 20px 20px 20px;
  flex: 1 1 auto;
  background-color: transparent !important;
  box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22) !important;
`;

const Des = styled(NFT)`
  text-align: left;
  padding-top: 0px;
`;

const Des2 = styled(NFT)`
  
  text-align: center;
  padding-top: 0px;
`;

const Roadmap = styled(NFT)`
  flex: 1 1;
  text-align: left;
  padding-top: 0px;
  min-width: 350px;
  
`;

const Teampanel = styled(NFT)`
  flex: 1 1;
  text-align: left;
  padding-top: 0px;
  min-width: 150px;
  text-align: center;
  
`;

const OldRoadmap = styled(NFT)`
  text-align: left;
  padding-top: 0px;
`;

const RoadMapContainer = styled.div`

  display: flex;
  gap: 20px;
  width: 100%;
  margin-bottom: 20px;
  flex-wrap: wrap;
  flex-direction: row;
  flex: 1;
`;

const OldRoadMapContainer = styled.div`

    
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20px;
  align: center;
  margin-bottom: 20px;
`;

const DesImage = styled(NFT2)`
  min-width: 100px;
  text-align: center;
  padding-top: 0px;
`;

const Valtimage = styled.h2`
align: center;
`;



const Card = styled(Paper)`
  display: inline-block;
  background-color: var(card-background-lighter-color) !important;
  margin: 5px;
  min-width: 40px;
  padding: 24px;
  h1{
    margin:0px;
  }
`;

const MintButtonContainer = styled.div`
  button.MuiButton-contained:not(.MuiButton-containedPrimary).Mui-disabled {
    color: #464646;
  }

  button.MuiButton-contained:not(.MuiButton-containedPrimary):hover,
  button.MuiButton-contained:not(.MuiButton-containedPrimary):focus {
    -webkit-animation: pulse 1s;
    animation: pulse 1s;
    box-shadow: 0 0 0 2em rgba(255, 255, 255, 0);
  }

  @-webkit-keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #ef8f6e;
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #ef8f6e;
    }
  }
`;

const Logo = styled.div`
  flex: 0 0 auto;

  img {
    height: 60px;
  }
`;
const Menu = styled.ul`
  list-style: none;
  display: inline-flex;
  flex: 1 0 auto;

  li {
    margin: 0 12px;

    a {
      color: var(--main-text-color);
      list-style-image: none;
      list-style-position: outside;
      list-style-type: none;
      outline: none;
      text-decoration: none;
      text-size-adjust: 100%;
      touch-action: manipulation;
      transition: color 0.3s;
      padding-bottom: 15px;

      img {
        max-height: 26px;
      }
    }

    a:hover, a:active {
      color: rgb(131, 146, 161);
      border-bottom: 4px solid var(--title-text-color);
    }

  }
`;

const SolExplorerLink = styled.a`
  color: var(--title-text-color);
  border-bottom: 1px solid var(--title-text-color);
  font-weight: bold;
  list-style-image: none;
  list-style-position: outside;
  list-style-type: none;
  outline: none;
  text-decoration: none;
  text-size-adjust: 100%;

  :hover {
    border-bottom: 2px solid var(--title-text-color);
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 4%;
  margin-left: 4%;
  text-align: center;
  justify-content: center;
`;

const MintContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  width: 100%;
`;

const NewContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  flex-wrap: wrap;
  gap: 20px;
  align: center;
  width: 100%;
`;



const DesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
  align: center;
  width: 100%;
`;

const DesContainerTop = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
  align: center;
  max-width: 500px;
  min-width: 400px;
`;



const Price = styled(Chip)`
  position: absolute;
  margin: 5px;
  font-weight: bold;
  font-size: 1.2em !important;
  font-family: 'Patrick Hand', cursive !important;
`;

const Image = styled.img`
  height: 400px;
  width: auto;
  border-radius: 7px;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
`;

const Pump = styled.video`
  height: 200px;
  width: auto;
  border-radius: 7px;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
`;

const CoinImage = styled.h1`
  height: 300px;
  width: auto;
  margin: 20px auto;
`;

const BorderLinearProgress = styled(LinearProgress)`
  margin: 20px;
  height: 10px !important;
  border-radius: 30px;
  border: 2px solid white;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
  background-color:var(--main-text-color) !important;
  
  > div.MuiLinearProgress-barColorPrimary{
    background-color:var(--title-text-color) !important;
  }

  > div.MuiLinearProgress-bar1Determinate {
    border-radius: 30px !important;
    background-image: linear-gradient(270deg, rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.5));
  }
`;

const ShimmerTitle = styled.h1`
  margin: 20px auto;
  text-transform: uppercase;
  animation: glow 2s ease-in-out infinite alternate;
  color: var(--main-text-color);
  @keyframes glow {
    from {
      text-shadow: 0 0 20px var(--main-text-color);
    }
    to {
      text-shadow: 0 0 30px var(--title-text-color), 0 0 10px var(--title-text-color);
    }
  }
`;

const ShimmerTitle2 = styled.h2`
  margin: 20px auto;
  animation: glow 2s ease-in-out infinite alternate;
  color: var(--main-text-color);
  @keyframes glow {
    from {
      text-shadow: 0 0 20px var(--main-text-color);
    }
    to {
      text-shadow: 0 0 30px var(--title-text-color), 0 0 10px var(--title-text-color);
    }
  }
`;

const GoldTitle = styled.h2`
  color: var(--title-text-color);
`;

const LogoAligner = styled.div`
  display: flex;
  align-items: center;

  img {
    max-height: 35px;
    margin-right: 10px;
  }
`;

const Map2 = {
    name: "my-map",
    areas: "map.json"
}

export interface HomeProps {
    candyMachineId: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    txTimeout: number;
    rpcHost: string;
}

const Home = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
    const [isActive, setIsActive] = useState(false); // true when countdown completes or whitelisted
    const [solanaExplorerLink, setSolanaExplorerLink] = useState<string>("");
    const [itemsAvailable, setItemsAvailable] = useState(0);
    const [itemsRedeemed, setItemsRedeemed] = useState(0);
    const [itemsRemaining, setItemsRemaining] = useState(0);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [payWithSplToken, setPayWithSplToken] = useState(false);
    const [price, setPrice] = useState(0);
    const [priceLabel, setPriceLabel] = useState<string>("SOL");
    const [whitelistPrice, setWhitelistPrice] = useState(0);
    const [whitelistEnabled, setWhitelistEnabled] = useState(false);
    const [isBurnToken, setIsBurnToken] = useState(false);
    const [whitelistTokenBalance, setWhitelistTokenBalance] = useState(0);
    const [isEnded, setIsEnded] = useState(false);
    const [endDate, setEndDate] = useState<Date>();
    const [isPresale, setIsPresale] = useState(false);
    const [isWLOnly, setIsWLOnly] = useState(false);

    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });

    const wallet = useAnchorWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();

    const rpcUrl = props.rpcHost;

    const refreshCandyMachineState = () => {
        (async () => {
            if (!wallet) return;

            const cndy = await getCandyMachineState(
                wallet as anchor.Wallet,
                props.candyMachineId,
                props.connection
            );

            setCandyMachine(cndy);
            setItemsAvailable(cndy.state.itemsAvailable);
            setItemsRemaining(cndy.state.itemsRemaining);
            setItemsRedeemed(cndy.state.itemsRedeemed);

            var divider = 1;
            if (decimals) {
                divider = +('1' + new Array(decimals).join('0').slice() + '0');
            }

            // detect if using spl-token to mint
            if (cndy.state.tokenMint) {
                setPayWithSplToken(true);
                // Customize your SPL-TOKEN Label HERE
                // TODO: get spl-token metadata name
                setPriceLabel(splTokenName);
                setPrice(cndy.state.price.toNumber() / divider);
                setWhitelistPrice(cndy.state.price.toNumber() / divider);
            } else {
                setPrice(cndy.state.price.toNumber() / LAMPORTS_PER_SOL);
                setWhitelistPrice(cndy.state.price.toNumber() / LAMPORTS_PER_SOL);
            }


            // fetch whitelist token balance
            if (cndy.state.whitelistMintSettings) {
                setWhitelistEnabled(true);
                setIsBurnToken(cndy.state.whitelistMintSettings.mode.burnEveryTime);
                setIsPresale(cndy.state.whitelistMintSettings.presale);
                setIsWLOnly(!isPresale && cndy.state.whitelistMintSettings.discountPrice === null);

                if (cndy.state.whitelistMintSettings.discountPrice !== null && cndy.state.whitelistMintSettings.discountPrice !== cndy.state.price) {
                    if (cndy.state.tokenMint) {
                        setWhitelistPrice(cndy.state.whitelistMintSettings.discountPrice?.toNumber() / divider);
                    } else {
                        setWhitelistPrice(cndy.state.whitelistMintSettings.discountPrice?.toNumber() / LAMPORTS_PER_SOL);
                    }
                }

                let balance = 0;
                try {
                    const tokenBalance =
                        await props.connection.getTokenAccountBalance(
                            (
                                await getAtaForMint(
                                    cndy.state.whitelistMintSettings.mint,
                                    wallet.publicKey,
                                )
                            )[0],
                        );

                    balance = tokenBalance?.value?.uiAmount || 0;
                } catch (e) {
                    console.error(e);
                    balance = 0;
                }
                setWhitelistTokenBalance(balance);
                setIsActive(isPresale && !isEnded && balance > 0);
            } else {
                setWhitelistEnabled(false);
            }

            // end the mint when date is reached
            if (cndy?.state.endSettings?.endSettingType.date) {
                setEndDate(toDate(cndy.state.endSettings.number));
                if (
                    cndy.state.endSettings.number.toNumber() <
                    new Date().getTime() / 1000
                ) {
                    setIsEnded(true);
                    setIsActive(false);
                }
            }
            // end the mint when amount is reached
            if (cndy?.state.endSettings?.endSettingType.amount) {
                let limit = Math.min(
                    cndy.state.endSettings.number.toNumber(),
                    cndy.state.itemsAvailable,
                );
                setItemsAvailable(limit);
                if (cndy.state.itemsRedeemed < limit) {
                    setItemsRemaining(limit - cndy.state.itemsRedeemed);
                } else {
                    setItemsRemaining(0);
                    cndy.state.isSoldOut = true;
                    setIsEnded(true);
                }
            } else {
                setItemsRemaining(cndy.state.itemsRemaining);
            }

            if (cndy.state.isSoldOut) {
                setIsActive(false);
            }
        })();
    };

    const renderGoLiveDateCounter = ({ days, hours, minutes, seconds }: any) => {
        return (
            <div><Card elevation={1}><h1>{days}</h1>Days</Card><Card elevation={1}><h1>{hours}</h1>
                Hours</Card><Card elevation={1}><h1>{minutes}</h1>Mins</Card><Card elevation={1}>
                    <h1>{seconds}</h1>Secs</Card></div>
        );
    };

    const renderEndDateCounter = ({ days, hours, minutes }: any) => {
        let label = "";
        if (days > 0) {
            label += days + " days "
        }
        if (hours > 0) {
            label += hours + " hours "
        }
        label += (minutes + 1) + " minutes left to MINT."
        return (
            <div><h3>{label}</h3></div>
        );
    };

    function displaySuccess(mintPublicKey: any): void {
        let remaining = itemsRemaining - 1;
        setItemsRemaining(remaining);
        setIsSoldOut(remaining === 0);
        if (isBurnToken && whitelistTokenBalance && whitelistTokenBalance > 0) {
            let balance = whitelistTokenBalance - 1;
            setWhitelistTokenBalance(balance);
            setIsActive(isPresale && !isEnded && balance > 0);
        }
        setItemsRedeemed(itemsRedeemed + 1);
        const solFeesEstimation = 0.012; // approx
        if (!payWithSplToken && balance && balance > 0) {
            setBalance(balance - (whitelistEnabled ? whitelistPrice : price) - solFeesEstimation);
        }
        setSolanaExplorerLink(cluster === "devnet" || cluster === "testnet"
            ? ("https://solscan.io/token/" + mintPublicKey + "?cluster=" + cluster)
            : ("https://solscan.io/token/" + mintPublicKey));
        throwConfetti();
    };

    function throwConfetti(): void {
        confetti({
            particleCount: 400,
            spread: 70,
            origin: { y: 0.6 },
        });
    }

    function myFunction(): any {
        confetti({
            particleCount: 400,
            spread: 70,
            origin: { y: 0.6 },
        });
    }


    const onMint = async () => {
        try {
            setIsMinting(true);
            if (wallet && candyMachine?.program && wallet.publicKey) {
                const mint = anchor.web3.Keypair.generate();
                const mintTxId = (
                    await mintOneToken(candyMachine, wallet.publicKey, mint)
                )[0];

                let status: any = { err: true };
                if (mintTxId) {
                    status = await awaitTransactionSignatureConfirmation(
                        mintTxId,
                        props.txTimeout,
                        props.connection,
                        'singleGossip',
                        true,
                    );
                }

                if (!status?.err) {
                    setAlertState({
                        open: true,
                        message: 'Congratulations! Mint succeeded!',
                        severity: 'success',
                    });

                    // update front-end amounts
                    displaySuccess(mint.publicKey);
                } else {
                    setAlertState({
                        open: true,
                        message: 'Mint failed! Please try again!',
                        severity: 'error',
                    });
                }
            }
        } catch (error: any) {
            // TODO: blech:
            let message = error.msg || 'Minting failed! Please try again!';
            if (!error.msg) {
                if (!error.message) {
                    message = 'Transaction Timeout! Please try again.';
                } else if (error.message.indexOf('0x138')) {
                } else if (error.message.indexOf('0x137')) {
                    message = `SOLD OUT!`;
                } else if (error.message.indexOf('0x135')) {
                    message = `Insufficient funds to mint. Please fund your wallet.`;
                }
            } else {
                if (error.code === 311) {
                    message = `SOLD OUT!`;
                } else if (error.code === 312) {
                    message = `Minting period hasn't started yet.`;
                }
            }

            setAlertState({
                open: true,
                message,
                severity: "error",
            });
        } finally {
            setIsMinting(false);
        }
    };


    useEffect(() => {
        (async () => {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [wallet, props.connection]);

    useEffect(refreshCandyMachineState, [
        wallet,
        props.candyMachineId,
        props.connection,
        isEnded,
        isPresale
    ]);

    return (
        <main>
            <MainContainer>
                <WalletContainer>
                    <Logo><a href="http://localhost:3000/" target="_blank" rel="noopener noreferrer"><img alt=""
                        src="logo2.png" /></a></Logo>
                    <Menu>
                        <li><a href="#">Home</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#roadmap">Roadmap</a></li>
                        <li><a href="#team">Team</a></li>
                    </Menu>
                    <Wallet>
                        {wallet ?
                            <WalletAmount>{(balance || 0).toLocaleString()} SOL<ConnectButton /></WalletAmount> :
                            <ConnectButton>Connect Wallet</ConnectButton>}
                    </Wallet>
                </WalletContainer>
                <ShimmerTitle>CRYPTOPUMPS</ShimmerTitle>
                <h2>By</h2>
                <Valtimage><img src="valtfit.png" width="300"></img></Valtimage>
                <ShimmerTitle> <video autoPlay loop muted width="300">
                    <source src={"whitelist.mp4"}
                        type="video/mp4" />
                </video>
                    <video autoPlay loop muted width="300">
                        <source src={"diamond.mp4"}
                            type="video/mp4" />
                    </video>
                    <video autoPlay loop muted width="300">
                        <source src={"platinum.mp4"}
                            type="video/mp4" />
                    </video>
                    <video autoPlay loop muted width="300">
                        <source src={"gold.mp4"}
                            type="video/mp4" />
                    </video>
                </ShimmerTitle>

                <br />
                <MintContainer>
                    <DesContainerTop>
                        <NFT3 elevation={3}>
                            <h2>The CryptoPump NFT</h2>
                            <br />
                            <div><Price
                                label={isActive && whitelistEnabled && (whitelistTokenBalance > 0) ? (whitelistPrice + " " + priceLabel) : (price + " " + priceLabel)} />
                                <img src="diamond.gif " width="80%">

                                </img>
                            </div>
                            <br />
                            {wallet && isActive && whitelistEnabled && (whitelistTokenBalance > 0) && isBurnToken &&
                                <h3>You own {whitelistTokenBalance} WL mint {whitelistTokenBalance > 1 ? "tokens" : "token"}.</h3>}
                            {wallet && isActive && whitelistEnabled && (whitelistTokenBalance > 0) && !isBurnToken &&
                                <h3>You are whitelisted and allowed to mint.</h3>}

                            {wallet && isActive && endDate && Date.now() < endDate.getTime() &&
                                <Countdown
                                    date={toDate(candyMachine?.state?.endSettings?.number)}
                                    onMount={({ completed }) => completed && setIsEnded(true)}
                                    onComplete={() => {
                                        setIsEnded(true);
                                    }}
                                    renderer={renderEndDateCounter}
                                />}
                            {wallet && isActive &&
                                <h3>TOTAL MINTED : {itemsRedeemed} / {itemsAvailable}</h3>}
                            {wallet && isActive && <BorderLinearProgress variant="determinate"
                                value={100 - (itemsRemaining * 100 / itemsAvailable)} />}
                            <br />
                            <MintButtonContainer>
                                {!isActive && !isEnded && candyMachine?.state.goLiveDate && (!isWLOnly || whitelistTokenBalance > 0) ? (
                                    <Countdown
                                        date={toDate(candyMachine?.state.goLiveDate)}
                                        onMount={({ completed }) => completed && setIsActive(!isEnded)}
                                        onComplete={() => {
                                            setIsActive(!isEnded);
                                        }}
                                        renderer={renderGoLiveDateCounter}
                                    />) : (
                                    !wallet ? (
                                        <ConnectButton>Connect Wallet</ConnectButton>
                                    ) : (!isWLOnly || whitelistTokenBalance > 0) ?
                                        candyMachine?.state.gatekeeper &&
                                            wallet.publicKey &&
                                            wallet.signTransaction ? (
                                            <GatewayProvider
                                                wallet={{
                                                    publicKey:
                                                        wallet.publicKey ||
                                                        new PublicKey(CANDY_MACHINE_PROGRAM),
                                                    //@ts-ignore
                                                    signTransaction: wallet.signTransaction,
                                                }}
                                                // // Replace with following when added
                                                // gatekeeperNetwork={candyMachine.state.gatekeeper_network}
                                                gatekeeperNetwork={
                                                    candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                                                } // This is the ignite (captcha) network
                                                /// Don't need this for mainnet
                                                clusterUrl={rpcUrl}
                                                options={{ autoShowModal: false }}
                                            >
                                                <MintButton
                                                    candyMachine={candyMachine}
                                                    isMinting={isMinting}
                                                    isActive={isActive}
                                                    isEnded={isEnded}
                                                    isSoldOut={isSoldOut}
                                                    onMint={onMint}
                                                />
                                            </GatewayProvider>
                                        ) : (
                                            <MintButton
                                                candyMachine={candyMachine}
                                                isMinting={isMinting}
                                                isActive={isActive}
                                                isEnded={isEnded}
                                                isSoldOut={isSoldOut}
                                                onMint={onMint}
                                            />
                                        ) :
                                        <h1>Mint is private.</h1>
                                )}
                            </MintButtonContainer>
                            <br />
                            {wallet && isActive && solanaExplorerLink &&
                                <SolExplorerLink href={solanaExplorerLink} target="_blank">View on Solscan</SolExplorerLink>}
                        </NFT3>
                    </DesContainerTop>
                    <DesContainer>
                        <Des elevation={2}>
                            <LogoAligner><img src="logo2.png" alt=""></img><GoldTitle>Whitelist Token</GoldTitle></LogoAligner>
                            <p>Congratulations, you're early. The Cryptopump whitelist token will grant holders first rights to minting Pump Cards.</p>
                            <p>Whitelist tokens are being airdropped soon, join the <a href="https://www.discord.gg/cryptopumps">discord</a> for more.</p>
                            <p>A whitelist token is exlusive access to the mint before the public, you won't want to miss out.</p>
                        </Des>
                        <Des elevation={2}>
                            <LogoAligner><img src="logo2.png" alt=""></img><GoldTitle><img src="valtfit.png" width="120"></img>Pump Card</GoldTitle></LogoAligner>
                            <p>The Pump Card is where our metaverse community and exlusive gym access comes into play.</p>
                            <p>Diamond, Platinum, and Gold Pump Cards will each have specific access to our DAO, among other community benefits.</p>
                            <p>Pump Card holders will be given tokens for <b>free mint access</b> to the CryptoPumps NFT collection.</p>
                        </Des>
                        <Des elevation={2}>
                            <LogoAligner><img src="logo2.png" alt=""></img><GoldTitle>CryptoPump NFT</GoldTitle></LogoAligner>
                            <p>The real collection. CryptoPumps NFT holders will be joining a strong, exclusive community with countless rewards.</p>
                            <p>Free <b>VALT</b> products, Mural in the <b>VALT Gym</b>, all expenses paid weekend in Miami, and much more.</p>

                        </Des>
                    </DesContainer>
                </MintContainer>
            </MainContainer>
            <MainContainer>
                <RoadMapContainer>
                    <DesContainer>
                        <ShimmerTitle>Diamond</ShimmerTitle>
                        <video autoPlay loop muted height="400px">
                            <source src={"diamondcard.mp4"}
                                type="video/mp4" />
                        </video>
                        <Des2>
                            <p>VIP DAO Access</p>
                            <p>3 Free Cryptopump Mints</p>
                            <p>Lifetime Event Access</p>
                            <p>1 Year Gym Membership</p>
                            <p>Physical Diamond Pump Card</p>
                            <p>VIP Access during events (Yacht, Table Service, Free Concession)</p>
                            <p>+2 Event Guestlist</p>
                        </Des2>
                    </DesContainer>
                    <DesContainer>
                        <ShimmerTitle>Platinum</ShimmerTitle>
                        <video autoPlay loop muted height="400px">
                            <source src={"platinumcard.mp4"}
                                type="video/mp4" />
                        </video>
                        <Des2>
                            <p>DAO Access</p>
                            <p>2 Free Cryptopump Mints</p>
                            <p>Lifetime Event Access</p>
                            <p>6 Month Gym Membership</p>
                            <p>Physical Platinum Pump Card</p>
                            <p>Discounted Access during events (Yacht, Free Concession)</p>
                            <p>+1 Event Guestlist</p>
                        </Des2>
                    </DesContainer>
                    <DesContainer>
                        <ShimmerTitle>Gold</ShimmerTitle>
                        <video autoPlay loop muted height="400px">
                            <source src={"goldcard.mp4"}
                                type="video/mp4" />
                        </video>
                        <Des2>
                            <p>DAO Access</p>
                            <p>1 Free Cryptopump Mint</p>
                            <p>Lifetime Event Access</p>
                            <p>3 Month Gym Membership</p>
                            <p>Physical Gold Pump Card</p>
                        </Des2>
                    </DesContainer>
                </RoadMapContainer>
            </MainContainer>
            <MainContainer>
                <section id="roadmap"></section>
                <ShimmerTitle>Roadmap</ShimmerTitle>
                <RoadMapContainer>
                    <Roadmap>
                        <GoldTitle>Phase 1 Pre Launch</GoldTitle>
                        <ul>
                            <li>
                                <p>Purchase of the Gym<mark className="checkmark"> &#10004;</mark></p>
                            </li>
                            <li>
                                <p>Building the team of Ambassadors<mark className="checkmark"> &#10004;</mark></p>
                            </li>
                            <li>
                                <p>IRL Gym Mural Paintings and Online Presence<mark className="checkmark"> &#10004;</mark></p>
                            </li>
                            <li>
                                <p>Whitelists to all Early Adopters<mark className="checkmark"> &#10004;</mark></p>
                            </li>
                            <li>
                                <p>Development of our influencer team within fitness, NFTs, and the Crypto industries<mark className="checkmark"> &#10004;</mark></p>

                            </li>
                        </ul>
                    </Roadmap>
                    <Roadmap>
                        <GoldTitle>Phase 2 Public Launch</GoldTitle>
                        <ul>
                            <li>
                                <p>Public Discord Launch&nbsp;(April 26-27)</p>
                            </li>
                            <li>
                                <p>DAO Partnership &amp; Collab Announcements&nbsp;(1st Week of May)</p>
                            </li>
                            <li>
                                <p>&ldquo;The Valt&rdquo; Gym Branding&nbsp;(1st Week of May)</p>
                            </li>
                            <li>
                                <p>Interior &amp; Exterior Paintings of CryptoPumps throughout the Gym&nbsp;(1st Week of May)</p>
                            </li>
                            <li>
                                <p>Physical RFID Cards&nbsp;(Mid May)</p>
                            </li>
                            <li>
                                <p>Fitness and NFT influencer promotions&nbsp;(Mid May)</p>
                            </li>
                            <li>
                                <p>Crypto Pump PUMP Collection Line&nbsp;(Mid May)</p>
                            </li>
                            <li>
                                <p>Whitelist Token Airdrop (1 Week Before Mint)</p>
                            </li>
                        </ul>
                    </Roadmap>
                </RoadMapContainer>
                <RoadMapContainer>
                    <Roadmap>
                        <GoldTitle>Phase 3 Mint Day May 28th</GoldTitle>
                        <ul>
                            <li>
                                <p>Pre-Mint &rarr;&nbsp;May 28th</p>
                            </li>
                            <li>
                                <p>Public Mint &rarr;&nbsp;May 29th</p>
                            </li>
                            <li>
                                <p>Top Ambassadors Flown Out to Mint Party in Miami&nbsp;Beginning of Memorial Day Weekend</p>
                            </li>
                            <li>
                                <p>CryptoPump Grand Opening Party &rarr; Night of Sunday the 29th</p>
                            </li>
                        </ul>
                    </Roadmap>
                    <Roadmap>
                        <GoldTitle>Phase 4 Burning &amp; Free PFP Collection</GoldTitle>
                        <ul>
                            <li>
                                <p>Shipment of Physical RFID Pump Cards Initiated</p>
                            </li>
                            <li>
                                <p>Free Mint of the CryptoPumps PFP</p>
                            </li>
                            <li>
                                <p>CryptoPumps PFP Utility and Roadmap Announced</p>
                            </li>
                        </ul>
                    </Roadmap>
                </RoadMapContainer>
                <RoadMapContainer>
                    <Roadmap>
                        <GoldTitle>Phase 5 Brand Expansion &amp; Sustainability</GoldTitle>
                        <ul>
                            <li>
                                <p>Splitting funds into two wallets: 1 for the Community &amp; 1 for the Brand</p>
                            </li>
                            <li>
                                <p>Host Events at the Gym for the holders around NFT and Crypto related events in Miami</p>
                            </li>
                            <li>
                                <p>Continue building the VALT Brand for the community</p>
                            </li>
                            <li>
                                <p>Look into properties in North America to open a second gym</p>
                            </li>
                        </ul>
                    </Roadmap>
                </RoadMapContainer>
            </MainContainer>
            <MainContainer>
                <Roadmap>
                    <img src="yaro.jpg" alt="Workplace" useMap="#workmap"></img>
                    <map name="workmap">
                        <area shape="rect" coords="34,44,270,350" alt="Computer" href="" ></area>
                        <area shape="rect" coords="290,172,333,250" alt="Phone" href=""  ></area>
                        <area shape="circle" coords="337,300,44" alt="Coffee" href="" ></area>
                    </map>
                    
                    
                </Roadmap>
            </MainContainer>
            <MainContainer>
                <section id="about"></section>
                <ShimmerTitle>About Us</ShimmerTitle>
                <RoadMapContainer>
                    <Des2>
                        <p>We are the world's first NFT gym membership. Our brand Valt Fit has recently purchased a gym with a massive lot along the Miami River, 341 NW South River Dr. Our first event will be taking place on the mint day (May 29th) which is the grand opening of the Valt! The NFT will be a “Pump Card”, which, when burned, will give you access to ALL future events by Crypto Pumps along with access to the free PFP collection: CryptoPumps. The Pump Card will come in 3 tiers: Diamond, Platinum, Gold. Based on the rarity the holders of the Pump card will be given a range of 1-3 free CryptoPumps. When you arrive at The Valt (GYM) to either get a pump in or to attend an event, the RFID card will open the gates to the property. Our focus is on building a fitness brand where others can collaborate and learn from each other along with networking within the space to benefit their own personal brands. When hosting events we will be collaborating with other projects to run NFT networking parties at least once a month, with our big event taking place during Art Basel.</p>

                        <Valtimage><img src="valtfit.png" width="50%"></img></Valtimage>
                    </Des2>
                </RoadMapContainer>
            </MainContainer>
            <MainContainer>
                <section id="team"></section>
                <ShimmerTitle>Team</ShimmerTitle>
                <RoadMapContainer>
                    <Teampanel>
                        <Valtimage><img src="yaro.jpg" width="75%"></img></Valtimage>
                        <h2>Yaro T 47</h2>
                        <p>Head of Security, Valt Fit Personal Trainer</p>
                    </Teampanel>
                    <Teampanel>
                        <Valtimage><img src="kev.jpg" width="75%"></img></Valtimage>
                        <h2>Kevin Badi</h2>
                        <p>Brand Founder &amp; CyptoPumps Admin</p>
                    </Teampanel>
                    <Teampanel>
                        <Valtimage><img src="2.jpg" width="75%"></img></Valtimage>
                        <h2>HMount</h2>
                        <p>Web3 &amp; Full Stack Developer</p>
                    </Teampanel>
                    <Teampanel>
                        <Valtimage><img src="3.jpg" width="75%"></img></Valtimage>
                        <h2>Connor</h2>
                        <p>@theimmaturemill</p>
                        <p>Project Manager</p>
                    </Teampanel>
                    <Teampanel>
                        <Valtimage><img src="4.jpg" width="75%"></img></Valtimage>
                        <h2>Zach Reisler</h2>
                        <p>Discord &amp; Outreach Manager </p>
                    </Teampanel>
                    <Teampanel>
                        <Valtimage><img src="5.jpg" width="75%"></img></Valtimage>
                        <h2>Mikey</h2>
                        <p>Social Media  &amp; Collaboration Manager </p>
                    </Teampanel>
                </RoadMapContainer>
            </MainContainer>
            <Snackbar
                open={alertState.open}
                autoHideDuration={6000}
                onClose={() => setAlertState({ ...alertState, open: false })}
            >
                <Alert
                    onClose={() => setAlertState({ ...alertState, open: false })}
                    severity={alertState.severity}
                >
                    {alertState.message}
                </Alert>
            </Snackbar>
        </main>
    );
};

export default Home;
