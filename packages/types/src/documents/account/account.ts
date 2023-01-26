import { Feature, Hosting, License, PlanType, Quotas } from "../../sdk"
import { QuotaUsage } from "../global"

export interface CreateAccount {
  email: string
  tenantId: string
  hosting: Hosting
  authType: AuthType
  tenantName: string
  name: string
  size: string
  profession: string
  password?: string
  stripeCustomerId?: string
}

export interface LicenseOverrides {
  features?: Feature[]
  quotas?: Quotas
}

export interface Account extends CreateAccount {
  // generated
  accountId: string
  createdAt: number
  // registration
  verified: boolean
  verificationSent: boolean
  // licensing
  tier?: string // deprecated
  planType?: PlanType
  planTier?: number
  license?: License
  licenseKey?: string
  licenseKeyActivatedAt?: number
  licenseOverrides?: LicenseOverrides
  quotaUsage?: QuotaUsage
}

export interface PasswordAccount extends Account {
  password: string
}

export const isPasswordAccount = (
  account: Account
): account is PasswordAccount =>
  account.authType === AuthType.PASSWORD && account.hosting === Hosting.SELF

export interface CloudAccount extends Account {
  budibaseUserId: string
}

export const isCloudAccount = (account: Account): account is CloudAccount =>
  account.hosting === Hosting.CLOUD

export const isSelfHostAccount = (account: Account) =>
  account.hosting === Hosting.SELF

export const isSSOAccount = (account: Account): account is SSOAccount =>
  account.authType === AuthType.SSO

export interface SSOAccount extends Account {
  pictureUrl?: string
  provider?: string
  providerType?: string
  oauth2?: OAuthTokens
  thirdPartyProfile: any // TODO: define what the google profile looks like
}

export enum AuthType {
  SSO = "sso",
  PASSWORD = "password",
}

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
}
