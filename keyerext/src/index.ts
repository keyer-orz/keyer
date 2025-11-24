export interface IExtension {
    run(name: string): React.ReactElement | null;
}