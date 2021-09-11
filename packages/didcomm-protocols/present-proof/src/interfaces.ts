import { IDIDCommAttachment } from "@aviarytech/didcomm-core";
import {
  IDIFPresentationExchangeDefinition,
  IDIFPresentationExchangeSubmission,
} from "@aviarytech/dif-presentation-exchange";

export interface IDIFPresentationExchangeDefinitionAttachment
  extends IDIDCommAttachment {
  id: string;
  media_type: "application/json";
  format: "dif/presentation-exchange/definitions@v1.0";
  data: {
    json: {
      dif: {
        options: {
          challenge: string;
          domain: string;
        };
        presentation_definition: IDIFPresentationExchangeDefinition;
      };
    };
  };
}

export interface IDIFPresentationExchangeSubmissionAttachment
  extends IDIDCommAttachment {
  id: string;
  media_type: "application/ld+json";
  format: "dif/presentation-exchange/submission@v1.0";
  data: {
    json: {
      dif: IDIFPresentationExchangeSubmission;
    };
  };
}
