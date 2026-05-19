import { useReactTable, getCoreRowModel, flexRender, getFilteredRowModel, getSortedRowModel, } from "@tanstack/react-table";
import "./DataTable.css"
import { useState } from "react";

const DataTable = ({ columns, data }) => {
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  });
  const jobStatuses = ["Applied", "Interview", "Waiting for Response", "Rejected", "Offer"];

  return (
    <table className="data-table">
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <>
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: "pointer" }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
            <tr>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.column.getCanFilter() ? (
                    header.column.id === "status" ? (
                      <select
                        value={header.column.getFilterValue() ?? ""}
                        onChange={(e) =>
                          header.column.setFilterValue(e.target.value)
                        }
                        className="column-filter"
                      >
                        <option value="">All</option>

                        {jobStatuses.map(status => (
                          <option
                            key={status}
                            value={status.toLowerCase()}
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={header.column.getFilterValue() ?? ""}
                        onChange={(e) =>
                          header.column.setFilterValue(e.target.value)
                        }
                        placeholder="Filter..."
                        className="column-filter"
                      />
                    )
                  ) : null}
                </th>
              ))}
            </tr>
          </>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.length > 0 ? (
          table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td className="row-data" key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell ??
                    cell.column.columnDef.accessorKey,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={columns.length}
              className="no-data"
            >
              No data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default DataTable;