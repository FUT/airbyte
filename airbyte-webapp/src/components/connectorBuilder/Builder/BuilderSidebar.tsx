import { faSliders } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classnames from "classnames";
import { useFormikContext } from "formik";
import { FormattedMessage, useIntl } from "react-intl";

import { Button } from "components/ui/Button";
import { Heading } from "components/ui/Heading";
import { Text } from "components/ui/Text";

import { useConfirmationModalService } from "hooks/services/ConfirmationModal";
import {
  BuilderView,
  DEFAULT_BUILDER_FORM_VALUES,
  useConnectorBuilderState,
} from "services/connectorBuilder/ConnectorBuilderStateService";

import { DownloadYamlButton } from "../DownloadYamlButton";
import { BuilderFormValues } from "../types";
import { AddStreamButton } from "./AddStreamButton";
import styles from "./BuilderSidebar.module.scss";
import { UiYamlToggleButton } from "./UiYamlToggleButton";

interface ViewSelectButtonProps {
  className?: string;
  selected: boolean;
  onClick: () => void;
}

const ViewSelectButton: React.FC<React.PropsWithChildren<ViewSelectButtonProps>> = ({
  children,
  className,
  selected,
  onClick,
}) => {
  return (
    <button
      className={classnames(className, styles.viewButton, {
        [styles.selectedViewButton]: selected,
        [styles.unselectedViewButton]: !selected,
      })}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface BuilderSidebarProps {
  className?: string;
  toggleYamlEditor: () => void;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({ className, toggleYamlEditor }) => {
  const { formatMessage } = useIntl();
  const { openConfirmationModal, closeConfirmationModal } = useConfirmationModalService();
  const { yamlManifest, selectedView, setSelectedView, setTestStreamIndex } = useConnectorBuilderState();
  const { values, setValues } = useFormikContext<BuilderFormValues>();
  const handleResetForm = () => {
    openConfirmationModal({
      text: "connectorBuilder.resetModal.text",
      title: "connectorBuilder.resetModal.title",
      submitButtonText: "connectorBuilder.resetModal.submitButton",
      onSubmit: () => {
        setValues(DEFAULT_BUILDER_FORM_VALUES);
        setSelectedView("global");
        closeConfirmationModal();
      },
    });
  };
  const handleViewSelect = (selectedView: BuilderView) => {
    setSelectedView(selectedView);
    if (selectedView !== "global") {
      setTestStreamIndex(selectedView);
    }
  };

  return (
    <div className={classnames(className, styles.container)}>
      <UiYamlToggleButton yamlSelected={false} onClick={toggleYamlEditor} />

      {/* TODO: replace with uploaded img when that functionality is added */}
      <img
        className={styles.connectorImg}
        src="/logo.png"
        alt={formatMessage({ id: "connectorBuilder.connectorImgAlt" })}
      />

      <div className={styles.connectorName}>
        <Heading as="h2" size="sm" className={styles.connectorNameText}>
          {values.global?.connectorName}
        </Heading>
      </div>

      <ViewSelectButton
        className={styles.globalConfigButton}
        selected={selectedView === "global"}
        onClick={() => handleViewSelect("global")}
      >
        <FontAwesomeIcon icon={faSliders} />
        <FormattedMessage id="connectorBuilder.globalConfiguration" />
      </ViewSelectButton>

      <div className={styles.streamsHeader}>
        <Text className={styles.streamsHeading} size="xs" bold>
          <FormattedMessage id="connectorBuilder.streamsHeading" values={{ number: values.streams.length }} />
        </Text>

        <AddStreamButton onAddStream={(addedStreamNum) => handleViewSelect(addedStreamNum)} />
      </div>

      <div className={styles.streamList}>
        {values.streams.map(({ name }, num) => (
          <ViewSelectButton key={num} selected={selectedView === num} onClick={() => handleViewSelect(num)}>
            {name && name.trim() ? (
              <Text className={styles.streamViewText}>{name}</Text>
            ) : (
              <Text className={styles.emptyStreamViewText}>
                <FormattedMessage id="connectorBuilder.emptyName" />
              </Text>
            )}
          </ViewSelectButton>
        ))}
      </div>

      <DownloadYamlButton className={styles.downloadButton} yamlIsValid yaml={yamlManifest} />
      <Button className={styles.resetButton} full variant="clear" onClick={() => handleResetForm()}>
        <FormattedMessage id="connectorBuilder.resetAll" />
      </Button>
    </div>
  );
};
