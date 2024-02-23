import type { BearerDid } from '@web5/dids';

export type AppDataBackup = {
  /**
   * A timestamp to record when the backup was made.
   */
  dateCreated: string;

  /**
   * The size of the backup data.
   */
  size: number;

  /**
   * Encrypted vault contents.
   */
  data: string;
}

export interface AppDataStore<T extends Record<string, any> = { InitializeResult: void }> {
  /**
   * Returns the DID associated with the AppDataStore instance.
   */
  getAgentDid(): Promise<BearerDid>

  /**
   * Returns an {@link AppDataStatus} object, which provides information about the current status of
   * the AppDataStore instance.
   */
  getStatus(): Promise<AppDataStatus>

  /**
   * Initializes the AppDataStore instance with the given `passphrase`.
   */
  initialize(params: { passphrase: string }): Promise<T['InitializeResult']>;

  /**
   * Creates a backup of the current state of the AppDataStore instance returning an
   * {@link AppDataBackup} object.
   *
   * The `passphrase` must be correct or the backup operation will fail.
   */
  backup(params: { passphrase: string }): Promise<AppDataBackup>;

  /**
   * Restores the AppDataStore instance to the state in the provided {@link AppDataBackup} object.
   *
   * The provided `passphrase` is used for the AppDataStore instance and a boolean is returned
   * indicating whether the restore was successful.
   */
  restore(params: { backup: AppDataBackup, passphrase: string }): Promise<boolean>;

  /**
   * Locks the AppDataStore, secured by a passphrase that must be entered to unlock.
   */
  lock(): Promise<void>;

  /**
   * Attempts to unlock the AppDataStore with the provided passphrase.
   *
   * A boolean is returned indicating whether the unlock was successful.
   */
  unlock(params: { passphrase: string }): Promise<boolean>;

  /**
   * Attempts to change the passphrase of the AppDataStore.
   *
   * The old passphrase is required for verification and a boolean is returned indicating whether
   * the passphrase change was successful.
   */
  changePassphrase(params: { oldPassphrase: string, newPassphrase: string }): Promise<boolean>;
}

export type AppDataStatus = {
  /**
   * Boolean indicating whether the AppDataStore has been initialized.
   */
  initialized: boolean;

  /**
   * The timestamp of the last backup.
   */
  lastBackup: string | null;

  /**
   * The timestamp of the last restore.
   */
  lastRestore: string | null;
}