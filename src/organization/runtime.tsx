import React, { useEffect, useState, useCallback, useRef } from 'react';
import { OrganizationGraph } from '@ant-design/graphs';
import { Button, Space } from 'antd';
import { PlusOutlined, MinusOutlined, ExpandOutlined } from '@ant-design/icons';
import { Data, MockData } from './constants';
import { Spin } from 'antd';
import EmptyWrap from '../components/emptyWrap';
import { callInputs, handleOutputFn } from '../utils';
import { chartTypes } from '../charts/constants';
import Style from './style.less';

export default function (props: RuntimeParams<Data>) {
  const graphRef = useRef<any>(null);
  const { data, env, inputs, outputs, style } = props;

  const [dataSourceInRuntime, setRuntimeDataSource] = useState<any>({ id: 'root' });
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState('');
  const [configData, setConfigData] = useState<Data['config']>(
    JSON.parse(JSON.stringify(data.config))
  );

  useEffect(() => {
    if (env.runtime) {
      setLoading(true);
      inputs.data((val: React.SetStateAction<any[]>, relOutputs: any) => {
        setRuntimeDataSource(val);
        handleOutputFn(relOutputs, outputs, 'data', val);
      });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    callInputs(chartTypes.ORGANIZATION, props, {
      setLoading,
      setTip,
      setConfigData
    });
  }, []);

  const handleReady = (graph: any) => {
    graphRef.current = graph;
  };

  // 放大
  const zoomIn = () => {
    const graph = graphRef.current;
    if (!graph) return;

    const currentZoom = graph.getZoom();

    graph.zoomTo(currentZoom * 1.2, {
      x: graph.getWidth() / 2,
      y: graph.getHeight() / 2
    });
  };

  // 缩小
  const zoomOut = () => {
    const graph = graphRef.current;
    if (!graph) return;

    const currentZoom = graph.getZoom();

    graph.zoomTo(currentZoom * 0.8, {
      x: graph.getWidth() / 2,
      y: graph.getHeight() / 2
    });
  };

  // 重置
  const resetZoom = () => {
    const graph = graphRef.current;
    if (!graph) return;

    graph.fitCenter();
    graph.zoomTo(1);
  };

  const onReady = useCallback((graph: any) => {
    graph.on('node:click', ({ item }) => {
      const { id, value } = item['_cfg'].model;
      outputs['nodeClick']?.({ id, value });
    });
  }, []);

  const { onReady: configOnReady, ...restConfig } = configData || {};

  const mergedOnReady = useCallback(
    (graph: any) => {
      configOnReady?.(graph);
      onReady(graph);
      handleReady(graph);
    },
    [configOnReady, onReady]
  );

  return (
    <Spin spinning={loading} tip={tip}>
      {!env.runtime || Object.keys(dataSourceInRuntime).length > 1 ? (
        <OrganizationGraph
          style={{ width: style.width, height: style.height }}
          {...restConfig}
          onReady={mergedOnReady}
          data={env.edit ? MockData : dataSourceInRuntime}
          key={env.edit ? JSON.stringify(data.config) : undefined}
        />
      ) : (
        <EmptyWrap
          style={{ width: style.width, height: style.height }}
          emptyText={data.emptyText}
          useEmpty={data.useEmpty}
          emptyImage={data.emptyImage}
        />
      )}
      {/* 缩放工具栏 */}
      <Space
        className={Style.btnContainer}
      >
        <Button icon={<PlusOutlined />} onClick={zoomIn} className={Style.btn} />
        <Button icon={<ExpandOutlined />} className={Style.btn} onClick={resetZoom} />
        <Button icon={<MinusOutlined />} onClick={zoomOut} className={Style.btn} />
      </Space>
    </Spin>
  );
}
