
export default function Merges(){


    const getMerges = async () => {
        try {
            const response = await fetch(`()/api/get_merges.py`, {
                method: 'GET',
                credentials: "include"
            }

            );
        }catch{
            console.error("error while fetching previous merges")
        }
    }
    

    return(
        <h1>This'll get filled in eventually</h1>
    );
}
