import type { IDIDCommAttachment } from "$lib/interfaces.js";
import type { IPresentationDefinition } from "@sphereon/pex"
import type { PresentationSubmission } from "@sphereon/pex-models"


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
        presentation_definition: IPresentationDefinition;
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
      dif: PresentationSubmission;
    };
  };
}
