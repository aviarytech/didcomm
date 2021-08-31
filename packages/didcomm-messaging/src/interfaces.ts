import { IJWE } from "@aviarytech/crypto-core";
import {
  DIDCOMM_MESSAGE_MEDIA_TYPE,
  IDIDCommPayload,
} from "@aviarytech/didcomm-core";

interface IDIDCommMessage {
  payload: IDIDCommPayload;
  repudiable: boolean;
  signature?: string;
}

interface IDIDCommMessageHandler {
  type: string;
  handle: (message: IDIDCommMessage) => Promise<boolean>;
}

interface IDIDComm {
  handleMessage(message: IDIDCommMessage): boolean;
  sendMessage: (message: IDIDCommMessage) => Promise<boolean>;
  receiveMessage(
    jwe: IJWE,
    mediaType: DIDCOMM_MESSAGE_MEDIA_TYPE
  ): Promise<boolean>;
}

export { IDIDComm, IDIDCommMessage, IDIDCommMessageHandler };
