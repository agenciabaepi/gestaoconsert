'use client';
import React from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export type Column<T> = {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
};

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead className="bg-gray-100">
        <tr>
          {columns.map(col => (
            <th
              key={col.key as string}
              className={`px-4 py-2 text-left text-sm font-medium text-gray-600 ${col.width || ''}`}
            >
              {col.header}
            </th>
          ))}
          {(onEdit || onDelete) && (
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Ações</th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr
            key={row[rowKey] as React.Key}
            className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition`}
          >
            {columns.map(col => (
              <td key={col.key as string} className="px-4 py-3 text-sm text-gray-700">
                {col.render ? col.render(row) : (row[col.key as keyof T] as any) ?? '-'}
              </td>
            ))}
            {(onEdit || onDelete) && (
              <td className="px-4 py-3 flex gap-2">
                {onEdit && (
                  <button type="button" onClick={() => onEdit(row)}>
                    <PencilSquareIcon className="h-5 w-5 text-gray-600 hover:text-black" />
                  </button>
                )}
                {onDelete && (
                  <button type="button" onClick={() => onDelete(row)}>
                    <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-800" />
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td
              colSpan={columns.length + ((onEdit || onDelete) ? 1 : 0)}
              className="px-4 py-6 text-center text-gray-500"
            >
              Nenhum registro encontrado
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default DataTable;