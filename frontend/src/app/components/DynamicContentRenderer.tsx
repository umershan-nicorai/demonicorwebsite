import React from 'react';
import { DynamicView } from '../services/api';

interface DynamicContentRendererProps {
  view: DynamicView;
  onClose: () => void;
}

const DynamicContentRenderer: React.FC<DynamicContentRendererProps> = ({ view, onClose }) => {
  // Function to render different view types
  const renderContent = () => {
    switch (view.type) {
      case 'chart':
        return renderChart(view.data);
      case 'card':
        return renderCard(view.data);
      case 'table':
        return renderTable(view.data);
      case 'custom':
        return renderCustom(view.data);
      default:
        return <div>Unsupported view type</div>;
    }
  };

  // Chart Renderer
  const renderChart = (data: any) => {
    // Unwrap nested data if present
    const chartData = data.data || data;
    let values: number[] = [];
    let labels: string[] = [];
    if (chartData.datasets && chartData.datasets.length > 0) {
      values = chartData.datasets[0].data || [];
      labels = chartData.labels || [];
    } else {
      values = chartData.values || [];
      labels = chartData.labels || [];
    }
    const title = chartData.title || 'Chart';
    const chartType = chartData.chartType || 'bar';
    if (!values.length || !labels.length) {
      return (
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">{title}</h3>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 text-blue-700 rounded-xl">
            <p className="text-base">No data available to display in the chart.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100">
        <h3 className="text-2xl font-bold mb-6 text-gray-900">{title}</h3>
        <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 flex items-end justify-center">
          <div className="w-full h-full flex items-end justify-around gap-4">
            {values.map((value: number, index: number) => (
              <div
                key={index}
                className="bg-gradient-to-t from-blue-600 to-indigo-500 w-10 rounded-xl shadow-md flex flex-col items-center justify-end relative transition-all duration-500"
                style={{ height: `${(value / Math.max(...values)) * 100}%` }}
              >
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-base font-semibold text-blue-700 drop-shadow">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-6">
          {labels.map((label: string, index: number) => (
            <div key={index} className="text-sm text-gray-700 text-center max-w-[150px] font-medium">
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Card Renderer
  const renderCard = (data: any) => {
    const cardData = data.data || data;
    const cards = cardData.cards || [cardData];
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100 max-w-5xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card: any, index: number) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-md border border-blue-100 hover:shadow-xl transition-shadow flex flex-col h-full">
              <h3 className="text-xl font-bold mb-3 text-gray-900">{card.title}</h3>
              <p className="text-gray-700 mb-4 flex-grow text-base">{card.content}</p>
              {card.actions && (
                <div className="flex space-x-2 mt-auto pt-4">
                  {card.actions.map((action: any, actionIndex: number) => (
                    <a
                      key={actionIndex}
                      href={action.url}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Table Renderer
  const renderTable = (data: any) => {
    // If data.table exists, use it as the source
    const tableData = data.table ? data.table : data;

    // Extract headers
    let headers: string[] = [];
    if (tableData.header && Array.isArray(tableData.header.rows)) {
      headers = tableData.header.rows;
    } else if (Array.isArray(tableData.headers)) {
      headers = tableData.headers;
    } else if (Array.isArray(tableData.columns)) {
      headers = tableData.columns.map((col: any) => col.header);
    } else if (tableData.header && (tableData.header.columns)) {
      headers = tableData.header.columns;
    }

    // Extract rows
    let rows: any[][] = [];
    if (Array.isArray(tableData.rows)) {
      if (tableData.rows.length > 0 && tableData.rows[0].cells) {
        rows = tableData.rows.map((row: any) => row.cells);
      } else {
        rows = tableData.rows;
      }
    }

    const title = data.title || 'Data Table';
    const description = data.description || '';
    if (headers.length === 0 || rows.length === 0) {
      return (
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">{title}</h3>
          {description && <p className="text-gray-600 mb-4">{description}</p>}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 text-blue-700 rounded-xl">
            <p className="text-base">No data available to display in the table.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="p-8 pb-4 border-b border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          {description && (
            <p className="text-base text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-100">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                {headers.map((header: string, index: number) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-50">
              {rows.map((row: any[], rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 whitespace-nowrap text-base text-gray-700"
                    >
                      {typeof cell === 'object' ? JSON.stringify(cell) : cell?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tableData.footer && (
          <div className="px-8 py-4 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 text-base text-gray-500">
            {tableData.footer}
          </div>
        )}
      </div>
    );
  };

  // Custom Content Renderer
  const renderCustom = (data: any) => {
    // Unwrap nested data if present
    const customData = data.data || data;
    
    // Set up title
    const title = customData.title || 'Information';
    
    // Check for paragraph/content format
    if (customData.content) {
      return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          <div
            className="prose max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: customData.content }}
          />
        </div>
      );
    }
    
    // Check for items array format (similar to the one seen in the console)
    if (customData.items && Array.isArray(customData.items)) {
      return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          <div className="space-y-4">
            {customData.items.map((item: any, index: number) => (
              <div key={index} className="p-4 border border-blue-100 rounded-lg bg-blue-50">
                <h4 className="text-lg font-medium text-blue-800 mb-2">
                  {item.title}
                </h4>
                <p className="text-gray-700">
                  {item.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Fallback for unknown formats
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-700">
          <p className="text-sm">Unable to display this content format.</p>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(customData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl shadow-sm w-full mb-4 overflow-hidden bg-blue-100">
      <div className="flex justify-between items-center p-4 border-b border-blue-200">
        <h2 className="text-lg font-semibold text-gray-800">
          {view.data.title || 'Dynamic Content'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-blue-200 hover:bg-blue-300 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="black" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 max-h-110 overflow-auto text-gray-800">
        {renderContent()}
      </div>
    </div>
  );
};

export default DynamicContentRenderer; 