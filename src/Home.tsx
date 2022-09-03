import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import confetti from "canvas-confetti";
import * as anchor from "@project-serum/anchor";
import {
    Commitment,
    Connection,
    PublicKey,
    Transaction,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { GatewayProvider } from '@civic/solana-gateway-react';
import Countdown from "react-countdown";
import { Snackbar, Paper, LinearProgress, Chip } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { AlertState, getAtaForMint, toDate } from './utils';
import { MintButton } from './MintButton';
import {
    awaitTransactionSignatureConfirmation,
    CANDY_MACHINE_PROGRAM,
    CandyMachineAccount,
    createAccountsForMint,
    getCandyMachineState,
    getCollectionPDA,
    mintOneToken,
    SetupState,
} from "./candy-machine";
import { Toaster } from 'react-hot-toast';


const cluster = process.env.REACT_APP_SOLANA_NETWORK!.toString();
const decimals = process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS ? +process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS!.toString() : 9;
const splTokenName = process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME ? process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME.toString() : "NUKE";

const WalletContainer = styled.div`
  display: flex;
  width: full;
  z-index: 2 !important;
  width: 100%;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  padding-left: 1%;
  padding-right: 1%;
  overflow: visible;
  box-sizing: border-box;
  position: sticky;
`;



const WalletAmount = styled.div`
  color: white;
  width: auto;
  padding: 5px 5px 5px 16px;
  position: relative;
  min-width: 48px;
  min-height: auto;
  border-radius: 50px;
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 2px;
  border-color: white;
  margin: 0;
  display: inline-flex;
  outline: 2px solid transparent;
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
  margin-top: 5px;
`;

const ConnectButton = styled(WalletMultiButton)`
  padding: 6px 16px;
  color: #1e232f !important;
  padding: 5px 16px 5px 16px;
  min-width: 100%;
  z-index: 2 !important;
  min-height: 100%;
  box-sizing: border-box;
  font-weight: 500;
  font-family: 'Poppins', sans-serif!important;
  line-height: 1.75;
  text-transform: uppercase;
  align-items: stretch;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
  overflow: hidden;
  background: white !important;
  border-radius: 5% !important;

  :hover {
    background-color: #a6a49e !important ;
    color: white !important;
  }
`;


const Mintphase = styled(Paper)`

width: 100%;
z-index: 1;
min-width: 300px;
position: relative;
margin: 0 auto;
background: rgba(0,0,0,0) !important;
@media only screen and (max-width: 768px) {
    /* For mobile phones: */
    [class*="Mintphase"] {
      width: 100%;
`;

const NFT = styled(Paper)`
  min-width: 100%;
  margin: 0 auto;
  z-index: 1;
  background: rgba(0,0,0,0) !important;
  padding: 5px 5px 5px 5px;
  flex: 1 1 auto;
  @media only screen and (max-width: 768px) {
    /* For mobile phones: */
    [class*="NFT"] {
      width: 100%;
`;

const Preview = styled(Paper)`
flex-basis: 60%;
position: relative;
margin: 0 auto;
background: rgba(0,0,0,0)!important;
`;


const Card = styled(Paper)`
margin: 0px auto;
background: rgba(0,0,0,0)!important;
text-decoration: none;
border: 3px solid white;
border-radius: 5% !important;
color: white !important;
transition: color 0.15s ease, border-color 0.15s ease;
min-width: 150px;

.card:hover,
.card:focus,
.card:active {
  color: #000000;
  border-color: #d9b086;
}
@media only screen and (max-width: 768px) {
    /* For mobile phones: */
    [class*="Card"] {
      width: 100%;
`;

const MintButtonContainer = styled.div`
  button.MuiButton-contained:not(.MuiButton-containedPrimary).Mui-disabled {
    color: black !important;
    width: 400px;
    font-size: 1em;
  }

  button.MuiButton-contained:not(.MuiButton-containedPrimary):hover,
  button.MuiButton-contained:not(.MuiButton-containedPrimary):active {
    background-color: #00D565 !important;
    font-size: 40px;
    color: white !important;

    :active {
        background-color: #00D565 !important;
        transform: translate(9px, 4px)!important;
    color: white !important;
    font-size: 40px;
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
    color: white;
  }
`;

const MainContainer = styled.div`
  display: absolute;
  flex-direction: column;
  margin-top: 0px;
  margin-bottom: 20px;
  margin-right: 2%;
  margin-left: 2%;
  text-align: center;
  justify-content: center;
`;

const MintContainer = styled.div`
  display: flex;
  flex-basis: 40%;
  position: relative;
  align-items: center;
  justify-content: stretch;
  background: rgba(0,0,0,0)!important;
`;

const DesContainer = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 20px;
  background: rgba(0,0,0,0)!important;
`;

const Price = styled(Chip)`
color: white !important;
text-decoration-color:  #34e2e4;
position: absolute;
left: 0px;
margin-top: 10px;
font-size: 40px !important;
  font-weight: bold;
  font-size: 1.4em !important;
  background-color: rgba(0,0,0,0) !important;
  font-family: 'Poppins', sans-serif !important;
`;

const Image = styled.img`
  height: auto;
  min-width: 100%;
  max-width: 100%;
  position: relative;
  left: -58px;
  background: rgba(0,0,0,0)!important;
  @media only screen and (max-width: 768px) {
    /* For mobile phones: */
    .Image {
      width: 100%;  }
    }
`;

const BorderLinearProgress = styled(LinearProgress)`
  min-width: 400px;
  height: 5px !important;
  background-color: rgba(255,255,255, 0.3) !important;

  > div.MuiLinearProgress-barColorPrimary {
    background-color: #34e2e4  !important;
  }

  > div.MuiLinearProgress-bar1Determinate {
    background: #34e2e4 !important;
  }
`;

<meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
export interface HomeProps {
    candyMachineId?: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    txTimeout: number;
    rpcHost: string;
    network: WalletAdapterNetwork;
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
    const [priceLabel, setPriceLabel] = useState<string>("◎");
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

    const [needTxnSplit, setNeedTxnSplit] = useState(true);
    const [setupTxn, setSetupTxn] = useState<SetupState>();

    const wallet = useWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();

    const rpcUrl = props.rpcHost;
    const solFeesEstimation = 0.012; // approx of account creation fees

    const anchorWallet = useMemo(() => {
        if (
            !wallet ||
            !wallet.publicKey ||
            !wallet.signAllTransactions ||
            !wallet.signTransaction
        ) {
            return;
        }

        return {
            publicKey: wallet.publicKey,
            signAllTransactions: wallet.signAllTransactions,
            signTransaction: wallet.signTransaction,
        } as anchor.Wallet;
    }, [wallet]);

    const refreshCandyMachineState = useCallback(
        async (commitment: Commitment = 'confirmed') => {
            if (!anchorWallet) {
                return;
            }

            const connection = new Connection(props.rpcHost, commitment);

            if (props.candyMachineId) {
                try {
                    const cndy = await getCandyMachineState(
                        anchorWallet,
                        props.candyMachineId,
                        connection,
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
                                            anchorWallet.publicKey,
                                        )
                                    )[0],
                                );

                            balance = tokenBalance?.value?.uiAmount || 0;
                        } catch (e) {
                            console.error(e);
                            balance = 0;
                        }
                        if (commitment !== "processed") {
                            setWhitelistTokenBalance(balance);
                        }
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

                    const [collectionPDA] = await getCollectionPDA(props.candyMachineId);
                    const collectionPDAAccount = await connection.getAccountInfo(
                        collectionPDA,
                    );

                    const txnEstimate =
                        892 +
                        (!!collectionPDAAccount && cndy.state.retainAuthority ? 182 : 0) +
                        (cndy.state.tokenMint ? 66 : 0) +
                        (cndy.state.whitelistMintSettings ? 34 : 0) +
                        (cndy.state.whitelistMintSettings?.mode?.burnEveryTime ? 34 : 0) +
                        (cndy.state.gatekeeper ? 33 : 0) +
                        (cndy.state.gatekeeper?.expireOnUse ? 66 : 0);

                    setNeedTxnSplit(txnEstimate > 1230);
                } catch (e) {
                    if (e instanceof Error) {
                        if (
                            e.message === `Account does not exist ${props.candyMachineId}`
                        ) {
                            setAlertState({
                                open: true,
                                message: `Couldn't fetch candy machine state from candy machine with address: ${props.candyMachineId}, using rpc: ${props.rpcHost}! You probably typed the REACT_APP_CANDY_MACHINE_ID value in wrong in your .env file, or you are using the wrong RPC!`,
                                severity: 'error',
                                hideDuration: null,
                            });
                        } else if (
                            e.message.startsWith('failed to get info about account')
                        ) {
                            setAlertState({
                                open: true,
                                message: `Couldn't fetch candy machine state with rpc: ${props.rpcHost}! This probably means you have an issue with the REACT_APP_SOLANA_RPC_HOST value in your .env file, or you are not using a custom RPC!`,
                                severity: 'error',
                                hideDuration: null,
                            });
                        }
                    } else {
                        setAlertState({
                            open: true,
                            message: `${e}`,
                            severity: 'error',
                            hideDuration: null,
                        });
                    }
                    console.log(e);
                }
            } else {
                setAlertState({
                    open: true,
                    message: `Your REACT_APP_CANDY_MACHINE_ID value in the .env file doesn't look right! Make sure you enter it in as plain base-58 address!`,
                    severity: 'error',
                    hideDuration: null,
                });
            }
        },
        [anchorWallet, props.candyMachineId, props.rpcHost, isEnded, isPresale, props.connection],
    );

    const renderGoLiveDateCounter = ({ days, hours, minutes, seconds }: any) => {
        return (
            <div><Card>You can mint in {days}:{hours}:{minutes}:{seconds}</Card></div>
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
        label += (minutes + 1) + " minutes left to mint"
        return (
            <div><h3>{label}</h3></div>
        );
    };

    function displaySuccess(mintPublicKey: any, qty: number = 1): void {
        let remaining = itemsRemaining - qty;
        setItemsRemaining(remaining);
        setIsSoldOut(remaining === 0);
        if (isBurnToken && whitelistTokenBalance && whitelistTokenBalance > 0) {
            let balance = whitelistTokenBalance - qty;
            setWhitelistTokenBalance(balance);
            setIsActive(isPresale && !isEnded && balance > 0);
        }
        setSetupTxn(undefined);
        setItemsRedeemed(itemsRedeemed + qty);
        if (!payWithSplToken && balance && balance > 0) {
            setBalance(balance - ((whitelistEnabled ? whitelistPrice : price) * qty) - solFeesEstimation);
        }
        setSolanaExplorerLink(cluster === "devnet" || cluster === "testnet"
            ? ("https://solscan.io/token/" + mintPublicKey + "?cluster=" + cluster)
            : ("https://solscan.io/token/" + mintPublicKey));
        setIsMinting(false);
        throwConfetti();
    };

    function throwConfetti(): void {
        confetti({
            particleCount: 400,
            spread: 70,
            origin: { y: 0.6 },
        });
    }


    const onMint = async (
        beforeTransactions: Transaction[] = [],
        afterTransactions: Transaction[] = [],
    ) => {
        try {
            if (wallet.connected && candyMachine?.program && wallet.publicKey) {
                setIsMinting(true);
                let setupMint: SetupState | undefined;
                if (needTxnSplit && setupTxn === undefined) {
                    setAlertState({
                        open: true,
                        message: 'Please validate account setup transaction',
                        severity: 'info',
                    });
                    setupMint = await createAccountsForMint(
                        candyMachine,
                        wallet.publicKey,
                    );
                    let status: any = { err: true };
                    if (setupMint.transaction) {
                        status = await awaitTransactionSignatureConfirmation(
                            setupMint.transaction,
                            props.txTimeout,
                            props.connection,
                            true,
                        );
                    }
                    if (status && !status.err) {
                        setSetupTxn(setupMint);
                        setAlertState({
                            open: true,
                            message:
                                'Setup transaction succeeded! You can now validate mint transaction',
                            severity: 'info',
                        });
                    } else {
                        setAlertState({
                            open: true,
                            message: 'Mint failed! Please try again!',
                            severity: 'error',
                        });
                        return;
                    }
                }

                const setupState = setupMint ?? setupTxn;
                const mint = setupState?.mint ?? anchor.web3.Keypair.generate();
                let mintResult = await mintOneToken(
                    candyMachine,
                    wallet.publicKey,
                    mint,
                    beforeTransactions,
                    afterTransactions,
                    setupState,
                );

                let status: any = { err: true };
                let metadataStatus = null;
                if (mintResult) {
                    status = await awaitTransactionSignatureConfirmation(
                        mintResult.mintTxId,
                        props.txTimeout,
                        props.connection,
                        true,
                    );

                    metadataStatus =
                        await candyMachine.program.provider.connection.getAccountInfo(
                            mintResult.metadataKey,
                            'processed',
                        );
                    console.log('Metadata status: ', !!metadataStatus);
                }

                if (status && !status.err && metadataStatus) {
                    setAlertState({
                        open: true,
                        message: 'Congratulations! Minted!',
                        severity: 'success',
                    });

                    // update front-end amounts
                    displaySuccess(mint.publicKey);
                    refreshCandyMachineState('processed');
                } else if (status && !status.err) {
                    setAlertState({
                        open: true,
                        message:
                            'Mint likely failed! Anti-bot SOL 0.01 fee potentially charged! Check the explorer to confirm the mint failed and if so, make sure you are eligible to mint before trying again.',
                        severity: 'error',
                        hideDuration: 8000,
                    });
                    refreshCandyMachineState();
                } else {
                    setAlertState({
                        open: true,
                        message: 'Mint failed! Please try again!',
                        severity: 'error',
                    });
                    refreshCandyMachineState();
                }
            }
        } catch (error: any) {
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
            if (anchorWallet) {
                const balance = await props.connection.getBalance(anchorWallet!.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [anchorWallet, props.connection]);

    useEffect(() => {
        refreshCandyMachineState();
    }, [
        anchorWallet,
        props.candyMachineId,
        props.connection,
        isEnded,
        isPresale,
        refreshCandyMachineState
    ]);


    return (

        <main>
            <MainContainer>
                <WalletContainer>
                    <a href="https://nukepad.io">
                        <img src="logo.svg" width="200" height="80" className="logo" />
                    </a>
                    <Wallet>
                        {wallet ?
                            <WalletAmount>{(balance || 0).toLocaleString()} SOL<ConnectButton /></WalletAmount> :
                            <ConnectButton>Select Wallet</ConnectButton>}
                    </Wallet>
                </WalletContainer>
                <div className="row">
                    <Preview elevation={0}>
                        <div className="giff">
                            <Image
                                src="show.gif"
                                alt="NFT" />
                        </div>
                    </Preview>


                    <MintContainer>
                        <DesContainer>
                        <div className="title">
                                    <h1>
                                        <b>Invisible Punkverse</b>
                                    </h1>
                                </div>
                                <div className="description">
                                    <p>
                                        By <a href="https://twitter.com/invisipunkverse"><b>Invisible Punkverse</b></a>
                                    </p>
                                </div>
                                <div className="description">
                                    <p>
                                    10,000 punks just turned invisible ! The first project to bring a Multiverse of Metaverse. Read more at <a href="https://invisiblepunkverse.xyz/">https://invisiblepunkverse.xyz/</a>
                                    </p>
                                </div>
                            <NFT elevation={3}>
                               {isActive && payWithSplToken && <Mintphase>

                                    <div className="box">
                                        <div className="phasename">
                                            <p>
                                          <b>NUKE PHASE </b>  
                                            </p>
                                            </div>
                                            <div className="pricenoww">
                                            <Price
                                            label={whitelistEnabled && (whitelistTokenBalance > 0) ? (whitelistPrice + " " + priceLabel) : (price + " " + priceLabel)} />
                                        </div>
                                        {isActive && <div className="live">
                                            <b>LIVE</b> </div>}
                                        {isEnded && <div className="live">
                                            <b>ENDED</b> </div>}
                                        <div className="counters" ms-auto>
                                            <p>Available: {itemsRemaining}/{itemsAvailable}</p> </div>


                                    </div>

                                </Mintphase>}
                                {isActive && isWLOnly && <Mintphase>

<div className="box">
    <div className="phasename">
        <p>
      <b>PUBLIC</b>  
        </p>
        </div>
        <div className="pricenoww">
        <Price
        label={whitelistEnabled && (whitelistTokenBalance > 0) ? (whitelistPrice + " " + priceLabel) : (price + " " + priceLabel)} />
    </div>
    {isActive && <div className="live">
        <b>LIVE</b> </div>}
    {isEnded && <div className="live">
        <b>ENDED</b> </div>}


</div>

</Mintphase>}

                                <BorderLinearProgress variant="determinate"
                                    value={100 - (100 - (itemsRedeemed * 100 / itemsAvailable))} />
<div className="totalcounter">
    <span> <h6>TOTAL MINTED</h6> </span>
    <span><h6>{itemsRedeemed} / {itemsAvailable}</h6></span>
</div>
                               
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
                                                    cluster={cluster}
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
                                    <SolExplorerLink href={solanaExplorerLink} target="_blank">View on
                                        Solscan</SolExplorerLink>}
                            </NFT>
                            <div className="phases">
                            
                                <p>
                                    <b>NUKE Phase</b> 3rd September at 2:30 PM UTC
                                </p>
                               
                                <p>
                                    <b>Public Phase</b> 3rd September at 3:30 PM UTC
                                </p>
                        
                            </div>
                            <div className="socials">
                                <a href="https://twitter.com/invisipunkverse"><img src="twitter.svg" width="30px" height="30px" /></a>&nbsp;&nbsp;&nbsp;
                                <a href="https://discord.gg/8Fbdzt6cbN"><img src="discord.svg" width="30px" height="30px" /></a>
                            </div>
                        </DesContainer>
                    </MintContainer>
                </div>


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
