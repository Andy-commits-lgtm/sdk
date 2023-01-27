import { Component, createSignal, For, Show } from 'solid-js';
import {
    UniversalQrModalStyled,
    H2Styled,
    QRCodeStyled,
    ButtonsContainerStyled,
    ActionButtonStyled,
    PopupWrapper,
    ExtensionLi,
    GetWalletStyled,
    TextStyled
} from './style';
import {
    ConnectAdditionalRequest,
    isWalletInfoInjected,
    WalletInfo,
    WalletInfoInjected,
    WalletInfoRemote
} from '@tonconnect/sdk';
import { appState } from 'src/app/state/app.state';
import { Translation } from 'src/app/components/typography/Translation';
import { addReturnStrategy, openLink, openLinkBlank } from 'src/app/utils/web-api';
import { setLastSelectedWalletInfo } from 'src/app/state/modals-state';
import { Transition } from 'solid-transition-group';
import { Button, Text } from 'src/app/components';
import { LINKS } from 'src/app/env/LINKS';

interface UniversalQrModalProps {
    additionalRequest: ConnectAdditionalRequest;

    walletsList: WalletInfo[];
}

export const UniversalQrModal: Component<UniversalQrModalProps> = props => {
    const [popupOpened, setPopupOpened] = createSignal(false);
    const connector = appState.connector;

    const walletsBridges = props.walletsList
        .filter(wallet => 'bridgeUrl' in wallet)
        .map(wallet => (wallet as WalletInfoRemote).bridgeUrl);

    let availableInjectableWallets = props.walletsList.filter(
        wallet => isWalletInfoInjected(wallet) && wallet.injected
    ) as WalletInfoInjected[];

    // to test popup
    /* availableInjectableWallets = availableInjectableWallets
        .concat(availableInjectableWallets)
        .concat(availableInjectableWallets);
*/
    const request = appState.connector.connect(walletsBridges) as string;

    const onOpenExtensionClick = (e: Event): void => {
        e.stopPropagation();
        if (availableInjectableWallets.length === 1) {
            const walletInfo = availableInjectableWallets[0]!;
            setLastSelectedWalletInfo(walletInfo);

            connector.connect(
                {
                    jsBridgeKey: walletInfo.jsBridgeKey
                },
                props.additionalRequest
            );
            return;
        }

        setPopupOpened(opened => !opened);
    };

    const onExtensionClick = (walletInfo: WalletInfoInjected): void => {
        setLastSelectedWalletInfo(walletInfo);

        connector.connect(
            {
                jsBridgeKey: walletInfo.jsBridgeKey
            },
            props.additionalRequest
        );
    };

    return (
        <UniversalQrModalStyled onClick={() => setPopupOpened(false)}>
            <H2Styled>Scan QR code with a TON Connect compatible wallet.</H2Styled>
            <QRCodeStyled sourceUrl={request} disableCopy={popupOpened()} />
            <ButtonsContainerStyled>
                <ActionButtonStyled
                    onClick={() => openLink(addReturnStrategy(request, appState.returnStrategy))}
                >
                    <Show when={availableInjectableWallets.length}>
                        <Translation translationKey="">Open wallet</Translation>
                    </Show>
                    <Show when={!availableInjectableWallets.length}>
                        <Translation translationKey="">Open installed wallet</Translation>
                    </Show>
                </ActionButtonStyled>
                <Show when={availableInjectableWallets.length}>
                    <ActionButtonStyled
                        onClick={onOpenExtensionClick}
                        disableEventsAnimation={popupOpened()}
                    >
                        <Transition
                            onBeforeEnter={el => {
                                el.animate(
                                    [
                                        { opacity: 0, transform: 'translateY(0)' },
                                        { opacity: 1, transform: 'translateY(-16px)' }
                                    ],
                                    {
                                        duration: 150
                                    }
                                );
                            }}
                            onExit={(el, done) => {
                                el.animate(
                                    [
                                        { opacity: 1, transform: 'translateY(-16px)' },
                                        { opacity: 0, transform: 'translateY(0)' }
                                    ],
                                    {
                                        duration: 150
                                    }
                                ).finished.then(done);
                            }}
                        >
                            <Show when={popupOpened()}>
                                <PopupWrapper>
                                    <For each={availableInjectableWallets}>
                                        {wallet => (
                                            <ExtensionLi onClick={() => onExtensionClick(wallet)}>
                                                <img src={wallet.imageUrl} alt="" />
                                                <Text fontWeight={590}>{wallet.name}</Text>
                                            </ExtensionLi>
                                        )}
                                    </For>
                                </PopupWrapper>
                            </Show>
                        </Transition>
                        <Translation translationKey="">Open Extension</Translation>
                    </ActionButtonStyled>
                </Show>
            </ButtonsContainerStyled>
            <Show when={!availableInjectableWallets.length}>
                <GetWalletStyled>
                    <TextStyled>Don't have compatible wallet?</TextStyled>
                    <Button onClick={() => openLinkBlank(LINKS.LEARN_MORE)}>
                        <Translation translationKey="walletModal.qrCodeModal.get">GET</Translation>
                    </Button>
                </GetWalletStyled>
            </Show>
        </UniversalQrModalStyled>
    );
};