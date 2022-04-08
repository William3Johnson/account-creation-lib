import { Name } from '@greymass/eosio'
import { ChainId } from 'eosio-signing-request'

import { generateReturnUrl } from './utils'
import { AccountCreationOptions, AccountCreationResponse } from './types'

export class AccountCreator {
    private popupWindow?: Window
    private scope?: Name
    private supportedChains: ChainId[]
    private whalesplainerUrl: string
    private returnUrl: string

    constructor(public readonly options: AccountCreationOptions) {
        this.supportedChains = (options.supportedChains || []).map((id) => ChainId.from(id))
        if (options.scope) {
            this.scope = Name.from(options.scope)
        }
        this.whalesplainerUrl = options.whalesplainerUrl || 'https://create.anchor.link'
        this.returnUrl = options.returnUrl || generateReturnUrl()
    }

    async createAccount(): Promise<AccountCreationResponse> {
        const qs = new URLSearchParams()
        qs.set('return_url', this.returnUrl)
        if (this.supportedChains.length > 0) {
            qs.set('supported_chains', this.supportedChains.map(String).join(','))
        }
        if (this.scope) {
            qs.set('scope', String(this.scope))
        }
        const url = `${this.whalesplainerUrl}/create?${qs}`
        this.popupWindow = window.open(
            url,
            'targetWindow',
            `toolbar=no,
            location=no,
            status=no,
            menubar=no,
            scrollbars=yes,
            resizable=yes,
            width=400,
            height=600`
        )!

        return new Promise((resolve) => {
            window.addEventListener(
                'message',
                (event) => {
                    if (event.data.status === 'success') {
                        resolve({
                            actor: event.data.actor,
                            network: event.data.network,
                            identityProof: event.data.identity_proof,
                        })
                    } else {
                        resolve({
                            error:
                                event.data.error ||
                                'An error occurred during the account creation process.',
                        })
                    }

                    this.popupWindow?.close()
                },
                false
            )
        })
    }

    closeDialog() {
        this.popupWindow?.close()
    }
}
