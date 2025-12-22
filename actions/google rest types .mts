// https://unpkg.com/@google/genai@1.34.0/dist/genai.d.ts



/** Response message for PredictionService.GenerateContent. */
export interface GenerateContentResponse {
    /** Used to retain the full HTTP response. */
    // sdkHttpResponse?: HttpResponse;
    /** Response variations returned by the model.
     */
    candidates?: Candidate[];
    /** Timestamp when the request is made to the server.
     */
    createTime?: string;
    /** The history of automatic function calling.
     */
    automaticFunctionCallingHistory?: Content[];
    /** Output only. The model version used to generate the response. */
    modelVersion?: string;
    /** Output only. Content filter results for a prompt sent in the request. Note: Sent only in the first stream chunk. Only happens when no candidates were generated due to content violations. */
    promptFeedback?: GenerateContentResponsePromptFeedback;
    /** Output only. response_id is used to identify each response. It is the encoding of the event_id. */
    responseId?: string;
    /** Usage metadata about the response(s). */
    usageMetadata?: GenerateContentResponseUsageMetadata;
    /**
     * Returns the concatenation of all text parts from the first candidate in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the text from the first
     * one will be returned.
     * If there are non-text parts in the response, the concatenation of all text
     * parts will be returned, and a warning will be logged.
     * If there are thought parts in the response, the concatenation of all text
     * parts excluding the thought parts will be returned.
     *
     * @example
     * ```ts
     * const response = await ai.models.generateContent({
     *   model: 'gemini-2.0-flash',
     *   contents:
     *     'Why is the sky blue?',
     * });
     *
     * console.debug(response.text);
     * ```
     */
    get text(): string | undefined;
    /**
     * Returns the concatenation of all inline data parts from the first candidate
     * in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the inline data from the
     * first one will be returned. If there are non-inline data parts in the
     * response, the concatenation of all inline data parts will be returned, and
     * a warning will be logged.
     */
    get data(): string | undefined;
    /**
     * Returns the function calls from the first candidate in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the function calls from
     * the first one will be returned.
     * If there are no function calls in the response, undefined will be returned.
     *
     * @example
     * ```ts
     * const controlLightFunctionDeclaration: FunctionDeclaration = {
     *   name: 'controlLight',
     *   parameters: {
     *   type: Type.OBJECT,
     *   description: 'Set the brightness and color temperature of a room light.',
     *   properties: {
     *     brightness: {
     *       type: Type.NUMBER,
     *       description:
     *         'Light level from 0 to 100. Zero is off and 100 is full brightness.',
     *     },
     *     colorTemperature: {
     *       type: Type.STRING,
     *       description:
     *         'Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.',
     *     },
     *   },
     *   required: ['brightness', 'colorTemperature'],
     *  };
     *  const response = await ai.models.generateContent({
     *     model: 'gemini-2.0-flash',
     *     contents: 'Dim the lights so the room feels cozy and warm.',
     *     config: {
     *       tools: [{functionDeclarations: [controlLightFunctionDeclaration]}],
     *       toolConfig: {
     *         functionCallingConfig: {
     *           mode: FunctionCallingConfigMode.ANY,
     *           allowedFunctionNames: ['controlLight'],
     *         },
     *       },
     *     },
     *   });
     *  console.debug(JSON.stringify(response.functionCalls));
     * ```
     */
    get functionCalls(): FunctionCall[] | undefined;
    /**
     * Returns the first executable code from the first candidate in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the executable code from
     * the first one will be returned.
     * If there are no executable code in the response, undefined will be
     * returned.
     *
     * @example
     * ```ts
     * const response = await ai.models.generateContent({
     *   model: 'gemini-2.0-flash',
     *   contents:
     *     'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.'
     *   config: {
     *     tools: [{codeExecution: {}}],
     *   },
     * });
     *
     * console.debug(response.executableCode);
     * ```
     */
    get executableCode(): string | undefined;
    /**
     * Returns the first code execution result from the first candidate in the response.
     *
     * @remarks
     * If there are multiple candidates in the response, the code execution result from
     * the first one will be returned.
     * If there are no code execution result in the response, undefined will be returned.
     *
     * @example
     * ```ts
     * const response = await ai.models.generateContent({
     *   model: 'gemini-2.0-flash',
     *   contents:
     *     'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.'
     *   config: {
     *     tools: [{codeExecution: {}}],
     *   },
     * });
     *
     * console.debug(response.codeExecutionResult);
     * ```
     */
    get codeExecutionResult(): string | undefined;
}


/** Output only. The traffic type for this request. This enum is not supported in Gemini API. */
export type TrafficType= 
    /**
     * Unspecified request traffic type.
     */
    | "TRAFFIC_TYPE_UNSPECIFIED"
    /**
     * The request was processed using Pay-As-You-Go quota.
     */
    | "ON_DEMAND"
    /**
     * Type for Provisioned Throughput traffic.
     */
    | "PROVISIONED_THROUGHPUT"

/** Usage metadata about the content generation request and response. This message provides a detailed breakdown of token usage and other relevant metrics. This data type is not supported in Gemini API. */
export interface GenerateContentResponseUsageMetadata {
    /** Output only. A detailed breakdown of the token count for each modality in the cached content. */
    cacheTokensDetails?: ModalityTokenCount[];
    /** Output only. The number of tokens in the cached content that was used for this request. */
    cachedContentTokenCount?: number;
    /** The total number of tokens in the generated candidates. */
    candidatesTokenCount?: number;
    /** Output only. A detailed breakdown of the token count for each modality in the generated candidates. */
    candidatesTokensDetails?: ModalityTokenCount[];
    /** The total number of tokens in the prompt. This includes any text, images, or other media provided in the request. When `cached_content` is set, this also includes the number of tokens in the cached content. */
    promptTokenCount?: number;
    /** Output only. A detailed breakdown of the token count for each modality in the prompt. */
    promptTokensDetails?: ModalityTokenCount[];
    /** Output only. The number of tokens that were part of the model's generated "thoughts" output, if applicable. */
    thoughtsTokenCount?: number;
    /** Output only. The number of tokens in the results from tool executions, which are provided back to the model as input, if applicable. */
    toolUsePromptTokenCount?: number;
    /** Output only. A detailed breakdown by modality of the token counts from the results of tool executions, which are provided back to the model as input. */
    toolUsePromptTokensDetails?: ModalityTokenCount[];
    /** The total number of tokens for the entire request. This is the sum of `prompt_token_count`, `candidates_token_count`, `tool_use_prompt_token_count`, and `thoughts_token_count`. */
    totalTokenCount?: number;
    /** Output only. The traffic type for this request. */
    trafficType?: TrafficType;
}


/** Represents token counting info for a single modality. */
export  interface ModalityTokenCount {
    /** The modality associated with this token count. */
    modality?: MediaModality;
    /** Number of tokens. */
    tokenCount?: number;
}


/** Server content modalities. */
export type MediaModality =
    /**
     * The modality is unspecified.
     */
    | "MODALITY_UNSPECIFIED"
    /**
     * Plain text.
     */
    | "TEXT"
    /**
     * Images.
     */
    | "IMAGE"
    /**
     * Video.
     */
    | "VIDEO"
    /**
     * Audio.
     */
    | "AUDIO"
    /**
     * Document, e.g. PDF file (jeff epstein).
     */
    | "DOCUMENT"


/** Content filter results for a prompt sent in the request. Note: This is sent only in the first stream chunk and only if no candidates were generated due to content violations. */
export interface GenerateContentResponsePromptFeedback {
    /** Output only. The reason why the prompt was blocked. */
    blockReason?: BlockedReason;
    /** Output only. A readable message that explains the reason why the prompt was blocked. This field is not supported in Gemini API. */
    blockReasonMessage?: string;
    /** Output only. A list of safety ratings for the prompt. There is one rating per category. */
    safetyRatings?: SafetyRating[];
}
/** Output only. The reason why the prompt was blocked. */
// FOR AN AMAZING REASON
export type BlockedReason =
    /**
     * The blocked reason is unspecified.
     */
    |"BLOCKED_REASON_UNSPECIFIED"
    /**
     * The prompt was blocked for safety reasons.
     */
    |"SAFETY"
    /**
     * The prompt was blocked for other reasons. For example, it may be due to the prompt's language, or because it contains other harmful content.
     */
    |"OTHER"
    /**
     * The prompt was blocked because it contains a term from the terminology blocklist.
     */
    |"BLOCKLIST"
    /**
     * The prompt was blocked because it contains prohibited content.
     */
    |"PROHIBITED_CONTENT"
    /**
     * The prompt was blocked because it contains content that is unsafe for image generation.
     */
    |"IMAGE_SAFETY"
    /**
     * The prompt was blocked by Model Armor. This enum value is not supported in Gemini API.
     */
    |"MODEL_ARMOR"
    /**
     * The prompt was blocked as a jailbreak attempt. This enum value is not supported in Gemini API.
     */
    |"JAILBREAK"


/** A response candidate generated from the model. */
export  interface Candidate {
    /** Contains the multi-part content of the response.
     */
    content?: Content;
    /** Source attribution of the generated content.
     */
    citationMetadata?: CitationMetadata;
    /** Describes the reason the model stopped generating tokens.
     */
    finishMessage?: string;
    /** Number of tokens for this candidate.
     */
    tokenCount?: number;
    /** The reason why the model stopped generating tokens.
     If empty, the model has not stopped generating the tokens.
     */
    finishReason?: FinishReason;
    /** Output only. Average log probability score of the candidate. */
    avgLogprobs?: number;
    /** Output only. Metadata specifies sources used to ground generated content. */
    groundingMetadata?: GroundingMetadata;
    /** Output only. Index of the candidate. */
    index?: number;
    /** Output only. Log-likelihood scores for the response tokens and top tokens */
    logprobsResult?: LogprobsResult;
    /** Output only. List of ratings for the safety of a response candidate. There is at most one rating per category. */
    safetyRatings?: SafetyRating[];
    /** Output only. Metadata related to url context retrieval tool. */
    urlContextMetadata?: UrlContextMetadata;
}


/** Metadata related to url context retrieval tool. */
export declare interface UrlContextMetadata {
    /** Output only. List of url context. */
    urlMetadata?: UrlMetadata[];
}/** Context of the a single url retrieval. */
export declare interface UrlMetadata {
    /** Retrieved url by the tool. */
    retrievedUrl?: string;
    /** Status of the url retrieval. */
    urlRetrievalStatus?: UrlRetrievalStatus;
}

/** Status of the url retrieval. */
export type UrlRetrievalStatus =
    /**
     * Default value. This value is unused.
     */
    | "URL_RETRIEVAL_STATUS_UNSPECIFIED"
    /**
     * Url retrieval is successful.
     */
    | "URL_RETRIEVAL_STATUS_SUCCESS"
    /**
     * Url retrieval is failed due to error.
     */
    | "URL_RETRIEVAL_STATUS_ERROR"
    /**
     * Url retrieval is failed because the content is behind paywall. This enum value is not supported in Vertex AI.
     */
    | "URL_RETRIEVAL_STATUS_PAYWALL"
    /**
     * Url retrieval is failed because the content is unsafe. This enum value is not supported in Vertex AI.
     */
    | "URL_RETRIEVAL_STATUS_UNSAFE"


/** Safety rating corresponding to the generated content. */
export declare interface SafetyRating {
    /** Output only. Indicates whether the content was filtered out because of this rating. */
    blocked?: boolean;
    /** Output only. Harm category. */
    category?: HarmCategory;
    /** Output only. The overwritten threshold for the safety category of Gemini 2.0 image out. If minors are detected in the output image, the threshold of each safety category will be overwritten if user sets a lower threshold. This field is not supported in Gemini API. */
    overwrittenThreshold?: HarmBlockThreshold;
    /** Output only. Harm probability levels in the content. */
    probability?: HarmProbability;
    /** Output only. Harm probability score. This field is not supported in Gemini API. */
    probabilityScore?: number;
    /** Output only. Harm severity levels in the content. This field is not supported in Gemini API. */
    severity?: HarmSeverity;
    /** Output only. Harm severity score. This field is not supported in Gemini API. */
    severityScore?: number;
}

/** The harm block threshold. */
export type HarmBlockThreshold= 
    /**
     * Unspecified harm block threshold.
     */
    |"HARM_BLOCK_THRESHOLD_UNSPECIFIED"
    /**
     * Block low threshold and above (i.e. block more).
     */
    |"BLOCK_LOW_AND_ABOVE"
    /**
     * Block medium threshold and above.
     */
    |"BLOCK_MEDIUM_AND_ABOVE"
    /**
     * Block only high threshold (i.e. block less).
     */
    |"BLOCK_ONLY_HIGH"
    /**
     * Block none.
     */
    |"BLOCK_NONE"
    /**
     * Turn off the safety filter.
     */
    |"OFF"


/** Harm category. */
export type HarmCategory= 
    /**
     * The harm category is unspecified.
     */
    |"HARM_CATEGORY_UNSPECIFIED"
    /**
     * The harm category is harassment.
     */
    |"HARM_CATEGORY_HARASSMENT"
    /**
     * The harm category is hate speech.
     */
    |"HARM_CATEGORY_HATE_SPEECH"
    /**
     * The harm category is sexually explicit content.
     */
    |"HARM_CATEGORY_SEXUALLY_EXPLICIT"
    /**
     * The harm category is dangerous content.
     */
    |"HARM_CATEGORY_DANGEROUS_CONTENT"
    /**
     * Deprecated: Election filter is not longer supported. The harm category is civic integrity.
     */
    |"HARM_CATEGORY_CIVIC_INTEGRITY"
    /**
     * The harm category is image hate. This enum value is not supported in Gemini API.
     */
    |"HARM_CATEGORY_IMAGE_HATE"
    /**
     * The harm category is image dangerous content. This enum value is not supported in Gemini API.
     */
    |"HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT"
    /**
     * The harm category is image harassment. This enum value is not supported in Gemini API.
     */
    |"HARM_CATEGORY_IMAGE_HARASSMENT"
    /**
     * The harm category is image sexually explicit content. This enum value is not supported in Gemini API.
     */
    |"HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT"
    /**
     * The harm category is for jailbreak prompts. This enum value is not supported in Gemini API.
     */
    |"HARM_CATEGORY_JAILBREAK"


/** Output only. Harm probability levels in the content. */
export type HarmProbability= 
    /**
     * Harm probability unspecified.
     */
    |"HARM_PROBABILITY_UNSPECIFIED"
    /**
     * Negligible level of harm.
     */
    |"NEGLIGIBLE"
    /**
     * Low level of harm.
     */
    |"LOW"
    /**
     * Medium level of harm.
     */
    |"MEDIUM"
    /**
     * High level of harm.
     */
    |"HIGH"


/** Output only. Harm severity levels in the content. This enum is not supported in Gemini API. */
export type HarmSeverity= 
    /**
     * Harm severity unspecified.
     */
    |"HARM_SEVERITY_UNSPECIFIED"
    /**
     * Negligible level of harm severity.
     */
    |"HARM_SEVERITY_NEGLIGIBLE"
    /**
     * Low level of harm severity.
     */
    |"HARM_SEVERITY_LOW"
    /**
     * Medium level of harm severity.
     */
    |"HARM_SEVERITY_MEDIUM"
    /**
     * High level of harm severity.
     */
    |"HARM_SEVERITY_HIGH"



/** Logprobs Result */
export  interface LogprobsResult {
    /** Length = total number of decoding steps. The chosen candidates may or may not be in top_candidates. */
    chosenCandidates?: LogprobsResultCandidate[];
    /** Length = total number of decoding steps. */
    topCandidates?: LogprobsResultTopCandidates[];
}
/** Candidate for the logprobs token and score. */
export  interface LogprobsResultCandidate {
    /** The candidate's log probability. */
    logProbability?: number;
    /** The candidate's token string value. */
    token?: string;
    /** The candidate's token id value. */
    tokenId?: number;
}

/** Candidates with top log probabilities at each decoding step. */
export  interface LogprobsResultTopCandidates {
    /** Sorted by log probability in descending order. */
    candidates?: LogprobsResultCandidate[];
}

/** Metadata returned to client when grounding is enabled. */
export  interface GroundingMetadata {
    /** Optional. Output only. Resource name of the Google Maps widget context token to be used with the PlacesContextElement widget to render contextual data. This is populated only for Google Maps grounding. This field is not supported in Gemini API. */
    googleMapsWidgetContextToken?: string;
    /** List of supporting references retrieved from specified grounding source. */
    groundingChunks?: GroundingChunk[];
    /** Optional. List of grounding support. */
    groundingSupports?: GroundingSupport[];
    /** Optional. Output only. Retrieval metadata. */
    retrievalMetadata?: RetrievalMetadata;
    /** Optional. Queries executed by the retrieval tools. This field is not supported in Gemini API. */
    retrievalQueries?: string[];
    /** Optional. Google search entry for the following-up web searches. */
    searchEntryPoint?: SearchEntryPoint;
    /** Optional. Output only. List of source flagging uris. This is currently populated only for Google Maps grounding. This field is not supported in Gemini API. */
    sourceFlaggingUris?: GroundingMetadataSourceFlaggingUri[];
    /** Optional. Web search queries for the following-up web search. */
    webSearchQueries?: string[];
}


/** Source content flagging uri for a place or review. This is currently populated only for Google Maps grounding. This data type is not supported in Gemini API. */
export  interface GroundingMetadataSourceFlaggingUri {
    /** A link where users can flag a problem with the source (place or review). */
    flagContentUri?: string;
    /** Id of the place or review. */
    sourceId?: string;
}


/** Google search entry point. */
export  interface SearchEntryPoint {
    /** Optional. Web content snippet that can be embedded in a web page or an app webview. */
    renderedContent?: string;
    /** Optional. Base64 encoded JSON representing array of tuple.
     * @remarks Encoded as base64 string. */
    sdkBlob?: string;
}

/** Grounding support. */
export  interface GroundingSupport {
    /** Confidence score of the support references. Ranges from 0 to 1. 1 is the most confident. For Gemini 2.0 and before, this list must have the same size as the grounding_chunk_indices. For Gemini 2.5 and after, this list will be empty and should be ignored. */
    confidenceScores?: number[];
    /** A list of indices (into 'grounding_chunk') specifying the citations associated with the claim. For instance [1,3,4] means that grounding_chunk[1], grounding_chunk[3], grounding_chunk[4] are the retrieved content attributed to the claim. */
    groundingChunkIndices?: number[];
    /** Segment of the content this support belongs to. */
    segment?: Segment;
}

/** Segment of the content. */
export  interface Segment {
    /** Output only. End index in the given Part, measured in bytes. Offset from the start of the Part, exclusive, starting at zero. */
    endIndex?: number;
    /** Output only. The index of a Part object within its parent Content object. */
    partIndex?: number;
    /** Output only. Start index in the given Part, measured in bytes. Offset from the start of the Part, inclusive, starting at zero. */
    startIndex?: number;
    /** Output only. The text corresponding to the segment from the response. */
    text?: string;
}



/** Metadata related to retrieval in the grounding flow. */
export  interface RetrievalMetadata {
    /** Optional. Score indicating how likely information from Google Search could help answer the prompt. The score is in the range `[0, 1]`, where 0 is the least likely and 1 is the most likely. This score is only populated when Google Search grounding and dynamic retrieval is enabled. It will be compared to the threshold to determine whether to trigger Google Search. */
    googleSearchDynamicRetrievalScore?: number;
}


/** Grounding chunk. */
export  interface GroundingChunk {
    /** Grounding chunk from Google Maps. This field is not supported in Gemini API. */
    maps?: GroundingChunkMaps;
    /** Grounding chunk from context retrieved by the retrieval tools. This field is not supported in Gemini API. */
    retrievedContext?: GroundingChunkRetrievedContext;
    /** Grounding chunk from the web. */
    web?: GroundingChunkWeb;
}


/** Chunk from context retrieved by the retrieval tools. This data type is not supported in Gemini API. */
export  interface GroundingChunkRetrievedContext {
    /** Output only. The full document name for the referenced Vertex AI Search document. */
    documentName?: string;
    /** Additional context for the RAG retrieval result. This is only populated when using the RAG retrieval tool. */
    ragChunk?: RagChunk;
    /** Text of the attribution. */
    text?: string;
    /** Title of the attribution. */
    title?: string;
    /** URI reference of the attribution. */
    uri?: string;
}



/** A RagChunk includes the content of a chunk of a RagFile, and associated metadata. This data type is not supported in Gemini API. */
export  interface RagChunk {
    /** If populated, represents where the chunk starts and ends in the document. */
    pageSpan?: RagChunkPageSpan;
    /** The content of the chunk. */
    text?: string;
}

/** Represents where the chunk starts and ends in the document. This data type is not supported in Gemini API. */
export  interface RagChunkPageSpan {
    /** Page where chunk starts in the document. Inclusive. 1-indexed. */
    firstPage?: number;
    /** Page where chunk ends in the document. Inclusive. 1-indexed. */
    lastPage?: number;
}

/** Chunk from the web. */
export  interface GroundingChunkWeb {
    /** Domain of the (original) URI. This field is not supported in Gemini API. */
    domain?: string;
    /** Title of the chunk. */
    title?: string;
    /** URI reference of the chunk. */
    uri?: string;
}

/** Chunk from Google Maps. This data type is not supported in Gemini API. */
export  interface GroundingChunkMaps {
    /** Sources used to generate the place answer. This includes review snippets and photos that were used to generate the answer, as well as uris to flag content. */
    placeAnswerSources?: GroundingChunkMapsPlaceAnswerSources;
    /** This Place's resource name, in `places/{place_id}` format. Can be used to look up the Place. */
    placeId?: string;
    /** Text of the place answer. */
    text?: string;
    /** Title of the place. */
    title?: string;
    /** URI reference of the place. */
    uri?: string;
}

/** Sources used to generate the place answer. This data type is not supported in Gemini API. */
export  interface GroundingChunkMapsPlaceAnswerSources {
    /** A link where users can flag a problem with the generated answer. */
    flagContentUri?: string;
    /** Snippets of reviews that are used to generate the answer. */
    reviewSnippets?: GroundingChunkMapsPlaceAnswerSourcesReviewSnippet[];
}

/** Author attribution for a photo or review. This data type is not supported in Gemini API. */
export  interface GroundingChunkMapsPlaceAnswerSourcesAuthorAttribution {
    /** Name of the author of the Photo or Review. */
    displayName?: string;
    /** Profile photo URI of the author of the Photo or Review. */
    photoUri?: string;
    /** URI of the author of the Photo or Review. */
    uri?: string;
}



/** Encapsulates a review snippet. This data type is not supported in Gemini API. */
export  interface GroundingChunkMapsPlaceAnswerSourcesReviewSnippet {
    /** This review's author. */
    authorAttribution?: GroundingChunkMapsPlaceAnswerSourcesAuthorAttribution;
    /** A link where users can flag a problem with the review. */
    flagContentUri?: string;
    /** A link to show the review on Google Maps. */
    googleMapsUri?: string;
    /** A string of formatted recent time, expressing the review time relative to the current time in a form appropriate for the language and country. */
    relativePublishTimeDescription?: string;
    /** A reference representing this place review which may be used to look up this place review again. */
    review?: string;
    /** Id of the review referencing the place. */
    reviewId?: string;
    /** Title of the review. */
    title?: string;
}

/** Output only. The reason why the model stopped generating tokens.

 If empty, the model has not stopped generating the tokens. */
export type FinishReason =
    /**
     * The finish reason is unspecified.
     */
    | "FINISH_REASON_UNSPECIFIED"
    /**
     * Token generation reached a natural stopping point or a configured stop sequence.
     */
    | "STOP"
    /**
     * Token generation reached the configured maximum output tokens.
     */
    | "MAX_TOKENS"
    /**
     * Token generation stopped because the content potentially contains safety violations. NOTE: When streaming, [content][] is empty if content filters blocks the output.
     */
    | "SAFETY"
    /**
     * The token generation stopped because of potential recitation.
     */
    | "RECITATION"
    /**
     * The token generation stopped because of using an unsupported language.
     */
    | "LANGUAGE"
    /**
     * All other reasons that stopped the token generation.
     */
    | "OTHER"
    /**
     * Token generation stopped because the content contains forbidden terms.
     */
    | "BLOCKLIST"
    /**
     * Token generation stopped for potentially containing prohibited content.
     */
    | "PROHIBITED_CONTENT"
    /**
     * Token generation stopped because the content potentially contains Sensitive Personally Identifiable Information (SPII).
     */
    | "SPII"
    /**
     * The function call generated by the model is invalid.
     */
    | "MALFORMED_FUNCTION_CALL"
    /**
     * Token generation stopped because generated images have safety violations.
     */
    | "IMAGE_SAFETY"
    /**
     * The tool call generated by the model is invalid.
     */
    | "UNEXPECTED_TOOL_CALL"
    /**
     * Image generation stopped because the generated images have prohibited content.
     */
    | "IMAGE_PROHIBITED_CONTENT"
    /**
     * The model was expected to generate an image, but none was generated.
     */
    | "NO_IMAGE"
    /**
     * Image generation stopped because the generated image may be a recitation from a source.
     */
    | "IMAGE_RECITATION"
    /**
     * Image generation stopped for a reason not otherwise specified.
     */
    | "IMAGE_OTHER"


/** Citation information when the model quotes another source. */
export  interface CitationMetadata {
    /** Contains citation information when the model directly quotes, at
     length, from another source. Can include traditional websites and code
     repositories.
     */
    citations?: Citation[];
}

/** Contains the multi-part content of a message. */
export  interface Content {
    /** List of parts that constitute a single message. Each part may have
     a different IANA MIME type. */
    parts?: Part[];
    /** Optional. The producer of the content. Must be either 'user' or 'model'. Useful to set for multi-turn conversations, otherwise can be left blank or unset. */
    role?: string;
}



/** Source attributions for content. This data type is not supported in Gemini API. */
export  interface Citation {
    /** Output only. End index into the content. */
    endIndex?: number;
    /** Output only. License of the attribution. */
    license?: string;
    /** Output only. Publication date of the attribution. */
    publicationDate?: GoogleTypeDate;
    /** Output only. Start index into the content. */
    startIndex?: number;
    /** Output only. Title of the attribution. */
    title?: string;
    /** Output only. Url reference of the attribution. */
    uri?: string;
}

/** Represents a whole or partial calendar date, such as a birthday. The time of day and time zone are either specified elsewhere or are insignificant. The date is relative to the Gregorian Calendar. This can represent one of the following: * A full date, with non-zero year, month, and day values. * A month and day, with a zero year (for example, an anniversary). * A year on its own, with a zero month and a zero day. * A year and month, with a zero day (for example, a credit card expiration date). Related types: * google.type.TimeOfDay * google.type.DateTime * google.protobuf.Timestamp. This data type is not supported in Gemini API. */
export  interface GoogleTypeDate {
    /** Day of a month. Must be from 1 to 31 and valid for the year and month, or 0 to specify a year by itself or a year and month where the day isn't significant. */
    day?: number;
    /** Month of a year. Must be from 1 to 12, or 0 to specify a year without a month and day. */
    month?: number;
    /** Year of the date. Must be from 1 to 9999, or 0 to specify a date without a year. */
    year?: number;
}

/** A datatype containing media content.

 Exactly one field within a Part should be set, representing the specific type
 of content being conveyed. Using multiple fields within the same `Part`
 instance is considered invalid. */
export  interface Part {
    /** Media resolution for the input media.
     */
    mediaResolution?: PartMediaResolution;
    /** Optional. Result of executing the [ExecutableCode]. */
    codeExecutionResult?: CodeExecutionResult;
    /** Optional. Code generated by the model that is meant to be executed. */
    executableCode?: ExecutableCode;
    /** Optional. URI based data. */
    fileData?: FileData;
    /** Optional. A predicted [FunctionCall] returned from the model that contains a string representing the [FunctionDeclaration.name] with the parameters and their values. */
    functionCall?: FunctionCall;
    /** Optional. The result output of a [FunctionCall] that contains a string representing the [FunctionDeclaration.name] and a structured JSON object containing any output from the function call. It is used as context to the model. */
    functionResponse?: FunctionResponse;
    /** Optional. Inlined bytes data. */
    inlineData?: Blob_2;
    /** Optional. Text part (can be code). */
    text?: string;
    /** Optional. Indicates if the part is thought from the model. */
    thought?: boolean;
    /** Optional. An opaque signature for the thought so it can be reused in subsequent requests.
     * @remarks Encoded as base64 string. */
    thoughtSignature?: string;
    /** Optional. Video metadata. The metadata should only be specified while the video data is presented in inline_data or file_data. */
    videoMetadata?: VideoMetadata;
}

/** Content blob. */
 interface Blob_2 {
    /** Required. Raw bytes.
     * @remarks Encoded as base64 string. */
    data?: string;
    /** Optional. Display name of the blob. Used to provide a label or filename to distinguish blobs. This field is only returned in PromptMessage for prompt management. It is currently used in the Gemini GenerateContent calls only when server side tools (code_execution, google_search, and url_context) are enabled. This field is not supported in Gemini API. */
    displayName?: string;
    /** Required. The IANA standard MIME type of the source data. */
    mimeType?: string;
}


/** Metadata describes the input video content. */
export  interface VideoMetadata {
    /** Optional. The end offset of the video. */
    endOffset?: string;
    /** Optional. The frame rate of the video sent to the model. If not specified, the default value will be 1.0. The fps range is (0.0, 24.0]. */
    fps?: number;
    /** Optional. The start offset of the video. */
    startOffset?: string;
}


export { Blob_2 as Blob }

/** A function response. */
export interface FunctionResponse {
    /** Signals that function call continues, and more responses will be returned, turning the function call into a generator. Is only applicable to NON_BLOCKING function calls (see FunctionDeclaration.behavior for details), ignored otherwise. If false, the default, future responses will not be considered. Is only applicable to NON_BLOCKING function calls, is ignored otherwise. If set to false, future responses will not be considered. It is allowed to return empty `response` with `will_continue=False` to signal that the function call is finished. */
    willContinue?: boolean;
    /** Specifies how the response should be scheduled in the conversation. Only applicable to NON_BLOCKING function calls, is ignored otherwise. Defaults to WHEN_IDLE. */
    scheduling?: FunctionResponseScheduling;
    /** List of parts that constitute a function response. Each part may
     have a different IANA MIME type. */
    parts?: FunctionResponsePart[];
    /** Optional. The id of the function call this response is for. Populated by the client to match the corresponding function call `id`. */
    id?: string;
    /** Required. The name of the function to call. Matches [FunctionDeclaration.name] and [FunctionCall.name]. */
    name?: string;
    /** Required. The function response in JSON object format. Use "output" key to specify function output and "error" key to specify error details (if any). If "output" and "error" keys are not specified, then whole "response" is treated as function output. */
    response?: Record<string, unknown>;
}

/** A datatype containing media that is part of a `FunctionResponse` message.

 A `FunctionResponsePart` consists of data which has an associated datatype. A
 `FunctionResponsePart` can only contain one of the accepted types in
 `FunctionResponsePart.data`.

 A `FunctionResponsePart` must have a fixed IANA MIME type identifying the
 type and subtype of the media if the `inline_data` field is filled with raw
 bytes. */
export interface FunctionResponsePart {
    /** Optional. Inline media bytes. */
    inlineData?: FunctionResponseBlob;
    /** Optional. URI based data. */
    fileData?: FunctionResponseFileData;
}

/** Raw media bytes for function response.

 Text should not be sent as raw bytes, use the FunctionResponse.response
 field. */
export interface FunctionResponseBlob {
    /** Required. The IANA standard MIME type of the source data. */
    mimeType?: string;
    /** Required. Inline media bytes.
     * @remarks Encoded as base64 string. */
    data?: string;
    /** Optional. Display name of the blob.
     Used to provide a label or filename to distinguish blobs. */
    displayName?: string;
}

/** URI based data for function response. */
export interface FunctionResponseFileData {
    /** Required. URI. */
    fileUri?: string;
    /** Required. The IANA standard MIME type of the source data. */
    mimeType?: string;
    /** Optional. Display name of the file.
     Used to provide a label or filename to distinguish files. */
    displayName?: string;
}


/** Specifies how the response should be scheduled in the conversation. */
export type FunctionResponseScheduling =
    /**
     * This value is unused.
     */
    | "SCHEDULING_UNSPECIFIED"
    /**
     * Only add the result to the conversation context do not interrupt or trigger generation.
     */
    | "SILENT"
    /**
     * Add the result to the conversation context and prompt to generate output without interrupting ongoing generation.
     */
    | "WHEN_IDLE"
    /**
     * Add the result to the conversation context, interrupt ongoing generation and prompt to generate output.
     */
    | "INTERRUPT"

/** A function call. */
export  interface FunctionCall {
    /** The unique id of the function call. If populated, the client to execute the
     `function_call` and return the response with the matching `id`. */
    id?: string;
    /** Optional. The function parameters and values in JSON object format. See [FunctionDeclaration.parameters] for parameter details. */
    args?: Record<string, unknown>;
    /** Optional. The name of the function to call. Matches [FunctionDeclaration.name]. */
    name?: string;
    /** Optional. The partial argument value of the function call. If provided, represents the arguments/fields that are streamed incrementally. This field is not supported in Gemini API. */
    partialArgs?: PartialArg[];
    /** Optional. Whether this is the last part of the FunctionCall. If true, another partial message for the current FunctionCall is expected to follow. This field is not supported in Gemini API. */
    willContinue?: boolean;
}

/** Partial argument value of the function call. This data type is not supported in Gemini API. */
export  interface PartialArg {
    /** Optional. Represents a null value. */
    nullValue?: 'NULL_VALUE';
    /** Optional. Represents a double value. */
    numberValue?: number;
    /** Optional. Represents a string value. */
    stringValue?: string;
    /** Optional. Represents a boolean value. */
    boolValue?: boolean;
    /** Required. A JSON Path (RFC 9535) to the argument being streamed. https://datatracker.ietf.org/doc/html/rfc9535. e.g. "$.foo.bar[0].data". */
    jsonPath?: string;
    /** Optional. Whether this is not the last part of the same json_path. If true, another PartialArg message for the current json_path is expected to follow. */
    willContinue?: boolean;
}

/** Media resolution for the input media. */
export  interface PartMediaResolution {
    /** The tokenization quality used for given media.
     */
    level?: PartMediaResolutionLevel;
    /** Specifies the required sequence length for media tokenization.
     */
    numTokens?: number;
}


/** The tokenization quality used for given media. */
export  type PartMediaResolutionLevel =
    /**
     * Media resolution has not been set.
     */
    | "MEDIA_RESOLUTION_UNSPECIFIED"
    /**
     * Media resolution set to low.
     */
    | "MEDIA_RESOLUTION_LOW"
    /**
     * Media resolution set to medium.
     */
    | "MEDIA_RESOLUTION_MEDIUM"
    /**
     * Media resolution set to high.
     */
    | "MEDIA_RESOLUTION_HIGH"
    /**
     * Media resolution set to ultra high.
     */
    | "MEDIA_RESOLUTION_ULTRA_HIGH"

    
/** Result of executing the [ExecutableCode]. Only generated when using the [CodeExecution] tool, and always follows a `part` containing the [ExecutableCode]. */
export  interface CodeExecutionResult {
    /** Required. Outcome of the code execution. */
    outcome?: Outcome;
    /** Optional. Contains stdout when code execution is successful, stderr or other description otherwise. */
    output?: string;
}

/** Outcome of the code execution. */
export type Outcome=
    /**
     * Unspecified status. This value should not be used.
     */
    | "OUTCOME_UNSPECIFIED"
    /**
     * Code execution completed successfully.
     */
    | "OUTCOME_OK"
    /**
     * Code execution finished but with a failure. `stderr` should contain the reason.
     */
    | "OUTCOME_FAILED"
    /**
     * Code execution ran for too long, and was cancelled. There may or may not be a partial output present.
     */
    | "OUTCOME_DEADLINE_EXCEEDED"

    /** Code generated by the model that is meant to be executed, and the result returned to the model. Generated when using the [CodeExecution] tool, in which the code will be automatically executed, and a corresponding [CodeExecutionResult] will also be generated. */
export  interface ExecutableCode {
    /** Required. The code to be executed. */
    code?: string;
    /** Required. Programming language of the `code`. */
    language?: Language;
}


/** Programming language of the `code`. */
export type Language =
    /**
     * Unspecified language. This value should not be used.
     */
    | "LANGUAGE_UNSPECIFIED"
    /**
     | 3.10, with numpy and simpy available.
     */
    | "PYTHON"


    
/** URI based data. */
export  interface FileData {
    /** Optional. Display name of the file data. Used to provide a label or filename to distinguish file datas. This field is only returned in PromptMessage for prompt management. It is currently used in the Gemini GenerateContent calls only when server side tools (code_execution, google_search, and url_context) are enabled. This field is not supported in Gemini API. */
    displayName?: string;
    /** Required. URI. */
    fileUri?: string;
    /** Required. The IANA standard MIME type of the source data. */
    mimeType?: string;
}
