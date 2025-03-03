import { useMonaco } from "@monaco-editor/react";
import { load, YAMLException } from "js-yaml";
import debounce from "lodash/debounce";
import isMatch from "lodash/isMatch";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useMemo, useRef, useState } from "react";

import { CodeEditor } from "components/ui/CodeEditor";

import { ConnectorManifest } from "core/request/ConnectorManifest";
import { useConfirmationModalService } from "hooks/services/ConfirmationModal";
import { useConnectorBuilderState } from "services/connectorBuilder/ConnectorBuilderStateService";

import { UiYamlToggleButton } from "../Builder/UiYamlToggleButton";
import { DownloadYamlButton } from "../DownloadYamlButton";
import { convertToManifest } from "../types";
import styles from "./YamlEditor.module.scss";

interface YamlEditorProps {
  toggleYamlEditor: () => void;
}

export const YamlEditor: React.FC<YamlEditorProps> = ({ toggleYamlEditor }) => {
  const { openConfirmationModal, closeConfirmationModal } = useConfirmationModalService();
  const yamlEditorRef = useRef<editor.IStandaloneCodeEditor>();
  const {
    yamlManifest,
    yamlIsValid,
    jsonManifest,
    builderFormValues,
    setYamlEditorIsMounted,
    setYamlIsValid,
    setJsonManifest,
  } = useConnectorBuilderState();
  const [yamlValue, setYamlValue] = useState(yamlManifest);

  // debounce the setJsonManifest calls so that it doesnt result in a network call for every keystroke
  const debouncedSetJsonManifest = useMemo(() => debounce(setJsonManifest, 200), [setJsonManifest]);

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco && yamlEditorRef.current && yamlValue) {
      const errOwner = "yaml";
      const yamlEditorModel = yamlEditorRef.current.getModel();

      try {
        const json = load(yamlValue) as ConnectorManifest;
        setYamlIsValid(true);
        debouncedSetJsonManifest(json);

        // clear editor error markers
        if (yamlEditorModel) {
          monaco.editor.setModelMarkers(yamlEditorModel, errOwner, []);
        }
      } catch (err) {
        if (err instanceof YAMLException) {
          setYamlIsValid(false);
          const mark = err.mark;

          // set editor error markers
          if (yamlEditorModel) {
            monaco.editor.setModelMarkers(yamlEditorModel, errOwner, [
              {
                startLineNumber: mark.line + 1,
                startColumn: mark.column + 1,
                endLineNumber: mark.line + 1,
                endColumn: mark.column + 2,
                message: err.message,
                severity: monaco.MarkerSeverity.Error,
              },
            ]);
          }
        }
      }
    }
  }, [yamlValue, monaco, debouncedSetJsonManifest, setYamlIsValid]);

  const yamlIsDirty = useMemo(() => {
    return !isMatch(convertToManifest(builderFormValues), jsonManifest);
  }, [jsonManifest, builderFormValues]);

  const handleToggleYamlEditor = () => {
    if (yamlIsDirty) {
      openConfirmationModal({
        text: "connectorBuilder.toggleModal.text",
        title: "connectorBuilder.toggleModal.title",
        submitButtonText: "connectorBuilder.toggleModal.submitButton",
        onSubmit: () => {
          toggleYamlEditor();
          closeConfirmationModal();
        },
      });
    } else {
      toggleYamlEditor();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.control}>
        <UiYamlToggleButton yamlSelected onClick={handleToggleYamlEditor} />
        <DownloadYamlButton yaml={yamlValue} yamlIsValid={yamlIsValid} />
      </div>
      <div className={styles.editorContainer}>
        <CodeEditor
          value={yamlValue}
          language="yaml"
          theme="airbyte-light"
          onChange={(value) => setYamlValue(value ?? "")}
          lineNumberCharacterWidth={6}
          onMount={(editor) => {
            setYamlEditorIsMounted(true);
            yamlEditorRef.current = editor;
          }}
        />
      </div>
    </div>
  );
};
