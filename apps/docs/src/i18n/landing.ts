import type { Locale } from "./ui";

export interface FeatureItem {
  /** Stable key — maps to a lucide icon in FeatureGrid. Order is preserved. */
  key: string;
  title: string;
  description: string;
}

export interface HowItWorksStep {
  title: string;
  body: string;
}

/** Output-showcase subhead, split so the inline code terms stay literal across locales. */
export interface OutputShowcaseSubhead {
  /** Text before the first code term. */
  lead: string;
  /** First inline code term (kept literal, e.g. "contact"). */
  code1: string;
  /** Text between the two code terms. */
  mid: string;
  /** Second inline code term (kept literal, e.g. "queryOptions"). */
  code2: string;
  /** Text after the second code term. */
  tail: string;
}

export interface LandingCopy {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: { before: string; accent: string; after: string };
    subhead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    badges: string[];
  };
  features: {
    heading: string;
    items: FeatureItem[];
  };
  howItWorks: {
    heading: string;
    steps: HowItWorksStep[];
  };
  outputShowcase: {
    heading: string;
    subhead: OutputShowcaseSubhead;
  };
  ctaBand: {
    heading: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
}

const en: LandingCopy = {
  meta: {
    title: "swagger-to-tanstack-query",
    description:
      "Point it at a Swagger spec, run one command, get fully-typed TanStack Query code — one folder per controller, using your own axios instance.",
  },
  hero: {
    eyebrow: "SWAGGER / OPENAPI → TANSTACK QUERY",
    title: { before: "Your spec in. ", accent: "Typed hooks", after: " out." },
    subhead:
      "Point it at a Swagger spec, run one command, get fully-typed TanStack Query code — one folder per controller, using your own axios instance.",
    ctaPrimary: "Open Playground",
    ctaSecondary: "Read the docs",
    badges: ["Swagger 2.0", "OpenAPI 3.x", "TanStack Query v5", "Bring your own axios", "MIT"],
  },
  features: {
    heading: "Everything typed, nothing hand-written.",
    items: [
      {
        key: "controller-output",
        title: "Controller-based output",
        description:
          "One folder per OpenAPI tag — each self-contained with its own types, apis, queries and mutations.",
      },
      {
        key: "tanstack-query",
        title: "TanStack Query v5",
        description:
          "GET / HEAD become queryOptions; POST / PUT / PATCH / DELETE become useXxx mutation hooks.",
      },
      {
        key: "bring-your-own-axios",
        title: "Bring your own axios",
        description:
          "baseURL, auth and interceptors stay in your instance. Generated code just imports it.",
      },
      {
        key: "envelope-unwrapping",
        title: "Response envelope unwrapping",
        description:
          "Return the inner payload, not { data, message, … } — type-safe through a generic envelope.",
      },
      {
        key: "typed-errors",
        title: "Typed errors",
        description: "Every hook's error is typed as AxiosError<YourErrorType>, applied per hook.",
      },
      {
        key: "faithful-types",
        title: "Faithful types",
        description: "$ref, allOf / oneOf / anyOf, enums, nullable, arrays, maps and binary → Blob.",
      },
      {
        key: "headers-uploads",
        title: "Header params & uploads",
        description:
          "in: header params via axios config; multipart/form-data assembled as FormData.",
      },
      {
        key: "docs-preserved",
        title: "Docs preserved",
        description:
          "summary and @deprecated from the spec carry through as JSDoc on the generated code.",
      },
      {
        key: "spec-dialects",
        title: "Swagger 2.0 & OpenAPI 3.x",
        description: "Both spec dialects are parsed and normalized to the same typed output.",
      },
      {
        key: "safe-identifiers",
        title: "Safe identifiers",
        description:
          "Reserved words and wire-name mismatches (page-size, delete) are handled correctly.",
      },
    ],
  },
  howItWorks: {
    heading: "From spec to hooks in three steps.",
    steps: [
      {
        title: "Add a config file",
        body: "Point swagger-to-tanstack-query.config.json at your spec and your axios instance.",
      },
      {
        title: "Run one command",
        body: "Generate the full typed client — one folder per controller.",
      },
      {
        title: "Use the hooks",
        body: "Drop the generated queryOptions straight into useQuery.",
      },
    ],
  },
  outputShowcase: {
    heading: "One folder per controller.",
    subhead: {
      lead: "The real generated output for a ",
      code1: "contact",
      mid: " controller — types, api functions, ",
      code2: "queryOptions",
      tail: ", mutation hooks and a barrel.",
    },
  },
  ctaBand: {
    heading: "Stop writing fetch wrappers.",
    ctaPrimary: "Open Playground",
    ctaSecondary: "Read the docs",
  },
};

const ko: LandingCopy = {
  meta: {
    title: "swagger-to-tanstack-query",
    description:
      "Swagger 스펙을 지정하고 명령어 하나만 실행하면, 완전한 타입이 적용된 TanStack Query 코드가 컨트롤러 단위 폴더로 생성됩니다. 여러분의 axios 인스턴스를 그대로 사용합니다.",
  },
  hero: {
    eyebrow: "SWAGGER / OPENAPI → TANSTACK QUERY",
    title: { before: "스펙을 넣으면 ", accent: "타입 안전한 훅", after: "이 나옵니다." },
    subhead:
      "Swagger 스펙만 지정하고 명령어 하나만 실행하면 완전한 타입의 TanStack Query 코드가 컨트롤러 단위 폴더로 생성됩니다. 여러분이 직접 만든 axios 인스턴스를 그대로 사용합니다.",
    ctaPrimary: "플레이그라운드 열기",
    ctaSecondary: "문서 보기",
    badges: ["Swagger 2.0", "OpenAPI 3.x", "TanStack Query v5", "내 axios 그대로", "MIT"],
  },
  features: {
    heading: "모든 것이 타입으로 정의되고, 손으로 쓸 코드는 없습니다.",
    items: [
      {
        key: "controller-output",
        title: "컨트롤러 단위 출력",
        description:
          "OpenAPI 태그마다 폴더 하나씩 생성되며, 각 폴더는 types, apis, queries, mutations를 모두 갖춘 독립 단위입니다.",
      },
      {
        key: "tanstack-query",
        title: "TanStack Query v5",
        description:
          "GET / HEAD는 queryOptions로, POST / PUT / PATCH / DELETE는 useXxx mutation 훅으로 생성됩니다.",
      },
      {
        key: "bring-your-own-axios",
        title: "내 axios 그대로",
        description:
          "baseURL, 인증, interceptor는 모두 여러분의 인스턴스에 그대로 둡니다. 생성된 코드는 그 인스턴스를 import할 뿐입니다.",
      },
      {
        key: "envelope-unwrapping",
        title: "응답 엔벨롭 벗기기",
        description:
          "{ data, message, … } 전체가 아니라 내부 payload만 반환합니다. 제네릭 엔벨롭(envelope)을 통해 타입 안전하게 동작합니다.",
      },
      {
        key: "typed-errors",
        title: "타입이 적용된 에러",
        description:
          "모든 훅의 error가 AxiosError<YourErrorType> 타입으로 지정되며, 훅 단위로 적용됩니다.",
      },
      {
        key: "faithful-types",
        title: "스펙에 충실한 타입",
        description:
          "$ref, allOf / oneOf / anyOf, enum, nullable, 배열, 맵, binary → Blob까지 빠짐없이 반영합니다.",
      },
      {
        key: "headers-uploads",
        title: "헤더 파라미터 & 업로드",
        description:
          "in: header 파라미터는 axios config로 전달하고, multipart/form-data는 FormData로 조립합니다.",
      },
      {
        key: "docs-preserved",
        title: "문서 보존",
        description:
          "스펙의 summary와 @deprecated가 생성된 코드의 JSDoc으로 그대로 이어집니다.",
      },
      {
        key: "spec-dialects",
        title: "Swagger 2.0 & OpenAPI 3.x",
        description: "두 스펙 형식 모두 파싱해 동일한 타입 출력으로 정규화합니다.",
      },
      {
        key: "safe-identifiers",
        title: "안전한 식별자",
        description:
          "예약어와 wire 이름 불일치(page-size, delete)도 올바르게 처리합니다.",
      },
    ],
  },
  howItWorks: {
    heading: "스펙에서 훅까지, 세 단계면 됩니다.",
    steps: [
      {
        title: "설정 파일 추가",
        body: "swagger-to-tanstack-query.config.json이 여러분의 스펙과 axios 인스턴스를 가리키도록 합니다.",
      },
      {
        title: "명령어 한 번 실행",
        body: "타입이 완비된 클라이언트 전체를 컨트롤러 단위 폴더로 생성합니다.",
      },
      {
        title: "훅 사용하기",
        body: "생성된 queryOptions를 useQuery에 바로 넣어 사용합니다.",
      },
    ],
  },
  outputShowcase: {
    heading: "컨트롤러마다 폴더 하나씩.",
    subhead: {
      lead: "",
      code1: "contact",
      mid: " 컨트롤러의 실제 생성 결과입니다 — types, api 함수, ",
      code2: "queryOptions",
      tail: ", mutation 훅, 그리고 barrel 파일까지.",
    },
  },
  ctaBand: {
    heading: "fetch 래퍼는 그만 작성하세요.",
    ctaPrimary: "플레이그라운드 열기",
    ctaSecondary: "문서 보기",
  },
};

const LANDING: Record<Locale, LandingCopy> = { en, ko };

export function getLanding(locale: Locale): LandingCopy {
  return LANDING[locale];
}
