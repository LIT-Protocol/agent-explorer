import { Flame } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const NetworkSelector = ({
    value,
    onValueChange,
}: {
    value: string;
    onValueChange: (value: string) => void;
}) => {
    const networks = [
        { id: "datil-dev", name: "DatilDev" },
        { id: "datil-test", name: "DatilTest" },
        { id: "datil", name: "Datil" },
    ];

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-32">
                <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {networks.map((network) => (
                        <SelectItem
                            key={network.id}
                            value={network.id}
                            className="flex items-center gap-2"
                        >
                            <div className="flex items-center gap-2">
                                <Flame className="h-4 w-4" />
                                <span>{network.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}; 