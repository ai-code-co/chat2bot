import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type SearchProps= {
  onSearch:(value:string)=>void
}
const SearchWithFilter = ({onSearch}:SearchProps) => {
  const [inputValue, setInputValue] = useState("")

  useEffect(()=>{
    const timeID = setTimeout(()=>{
      onSearch(inputValue)
    },500)
    return ()=> clearTimeout(timeID)
  },[inputValue])

  return (
    <div className="flex items-center gap-3 w-full max-w-md">

      {/* Search Bar */}
      <div className="relative w-full">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
        />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-md bg-[#3F424A] text-sm text-white focus:outline-none focus:ring-2 focus:ring-black/10
          placeholder-slate-500 "
          value={inputValue ?? ""}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      {/* Filter Button */}
      {/* <button className="p-2 rounded-md bg-[#1E1F22] hover:bg-gray-200 transition">
        <ListFilter className="w-5 h-5 text-[#10A37F]" />
      </button> */}
    </div>
  );
};

export default SearchWithFilter;
