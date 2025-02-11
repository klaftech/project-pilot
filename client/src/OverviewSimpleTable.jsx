import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

function OverviewSimpleTable({data}) {
    return (
        <TableContainer component={Paper}>
            <Table className="min-w-full">
                <TableHead>
                    <TableRow>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>

                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.id}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.name}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>

                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default OverviewSimpleTable;