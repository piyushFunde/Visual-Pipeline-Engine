import { BaseNode } from './BaseNode';

export const createNode = ({
  label,
  fields = [],
  handles = [],
  renderContent,
}) => {
  return function ConfiguredNode({ id, data }) {
    const values = fields.reduce((acc, field) => {
      acc[field.name] = data?.[field.name] ?? field.defaultValue ?? '';
      return acc;
    }, { ...data });

    return (
      <BaseNode
        id={id}
        label={label}
        handles={handles}
        fields={fields}
        values={values}
      >
        {renderContent ? renderContent({ id, data }) : null}
      </BaseNode>
    );
  };
};
