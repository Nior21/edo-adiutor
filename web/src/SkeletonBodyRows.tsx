type SkeletonBodyRowsProps = {

  rows?: number;

  cols?: number;

};



export function SkeletonBodyRows({ rows = 3, cols = 5 }: SkeletonBodyRowsProps) {

  return (

    <>

      {Array.from({ length: rows }).map((_, rowIndex) => (

        <tr key={rowIndex} className="skeleton-row">

          {Array.from({ length: cols }).map((__, colIndex) => (

            <td key={`${rowIndex}-${colIndex}`}>

              {colIndex === 0 ? (

                <div className="skeleton-doc-cell">

                  <span className="shimmer-block shimmer-block-css shimmer-block-short" />

                  <span className="shimmer-block shimmer-block-css shimmer-block-mid" />

                  <span className="shimmer-block shimmer-block-css shimmer-block-short" />

                </div>

              ) : (

                <span className="shimmer-block shimmer-block-tall shimmer-block-css" />

              )}

            </td>

          ))}

        </tr>

      ))}

    </>

  );

}

