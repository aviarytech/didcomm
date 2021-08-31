import { IJWE, IJWS } from "@aviarytech/crypto-core";
import { IDIDCommPayload } from "@aviarytech/didcomm-core";

interface IDIDCommMessage {
  payload: IDIDCommPayload;
  repudiable: boolean;
  signature?: string;
}

interface IDIDCommMessageHandler {
  type: string;
  handle: (message: IDIDCommPayload) => Promise<boolean>;
}

interface IDIDComm {
  sendMessage: (msg: IDIDCommMessage) => Promise<boolean>;
}

export { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler };
