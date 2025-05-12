export interface IVerifyEncryptedHashTokenPairReturn<T> {
    payload: T | null;
    tokenHash: string | null;
    error: Error | null
}