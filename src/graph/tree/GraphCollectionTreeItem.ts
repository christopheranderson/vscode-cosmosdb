/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Container, ContainerDefinition, CosmosClient, Resource } from '@azure/cosmos';
import * as vscode from 'vscode';
import { AzureParentTreeItem, AzureTreeItem, DialogResponses, TreeItemIconPath, UserCancelledError } from 'vscode-azureextensionui';
import { DocDBStoredProceduresTreeItem } from '../../docdb/tree/DocDBStoredProceduresTreeItem';
import { DocDBStoredProcedureTreeItem } from '../../docdb/tree/DocDBStoredProcedureTreeItem';
import { IDocDBTreeRoot } from '../../docdb/tree/IDocDBTreeRoot';
import { GraphDatabaseTreeItem } from './GraphDatabaseTreeItem';
import { GraphTreeItem } from './GraphTreeItem';

export class GraphCollectionTreeItem extends AzureParentTreeItem<IDocDBTreeRoot> {
    public static contextValue: string = "cosmosDBGraph";
    public readonly contextValue: string = GraphCollectionTreeItem.contextValue;
    public readonly parent: GraphDatabaseTreeItem;

    private readonly _graphTreeItem: GraphTreeItem;
    private readonly _storedProceduresTreeItem: DocDBStoredProceduresTreeItem;

    private readonly _collection: ContainerDefinition & Resource;

    constructor(parent: GraphDatabaseTreeItem, collection: ContainerDefinition & Resource) {
        super(parent);
        this._collection = collection;
        this._graphTreeItem = new GraphTreeItem(this, this._collection);
        this._storedProceduresTreeItem = new DocDBStoredProceduresTreeItem(this);
    }

    public get id(): string {
        return this._collection.id;
    }

    public get label(): string {
        return this._collection.id;
    }

    public get link(): string {
        return this._collection._self;
    }

    public get iconPath(): TreeItemIconPath {
        return new vscode.ThemeIcon('files');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzureTreeItem<IDocDBTreeRoot>[]> {
        return [this._graphTreeItem, this._storedProceduresTreeItem];
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const message: string = `Are you sure you want to delete graph '${this.label}' and its contents?`;
        const result = await vscode.window.showWarningMessage(message, { modal: true }, DialogResponses.deleteResponse, DialogResponses.cancel);
        if (result === DialogResponses.deleteResponse) {
            const client = this.root.getCosmosClient();
            await this.getContainerClient(client).delete();
        } else {
            throw new UserCancelledError();
        }
    }

    public pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): AzureTreeItem<IDocDBTreeRoot> | undefined {
        for (const expectedContextValue of expectedContextValues) {
            switch (expectedContextValue) {
                case GraphTreeItem.contextValue:
                    return this._graphTreeItem;
                case DocDBStoredProceduresTreeItem.contextValue:
                case DocDBStoredProcedureTreeItem.contextValue:
                    return this._storedProceduresTreeItem;

                default:
            }
        }

        return undefined;
    }

    public getContainerClient(client: CosmosClient): Container {
        return (this.parent.getDatabaseClient(client)).container(this.id);

    }
}
