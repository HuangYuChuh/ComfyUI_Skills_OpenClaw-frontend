import { CustomSelect } from "../ui/CustomSelect";
import type { Language } from "../../i18n";

interface LanguageSelectProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <CustomSelect
      value={value}
      options={[
        { value: "en", label: "English" },
        { value: "zh", label: "简体中文" },
        { value: "zh_hant", label: "繁體中文" },
        { value: "ja", label: "日本語" },
      ]}
      onChange={(next) => onChange(next as Language)}
      ariaLabel="Language selector"
      className="is-lang-select"
    />
  );
}
