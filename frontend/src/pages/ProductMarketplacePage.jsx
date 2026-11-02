
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function ProductMarketplacePage() {
  const [products, setProducts] =
    useState([])

  useEffect(() => {
    fetch(
      "http://localhost:5000/api/products"
    )
      .then((res) => res.json())

      .then((data) =>
        setProducts(data)
      )

      .catch((error) =>
        console.error(error)
      )
  }, [])

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to={dashboardPath}
          className="text-green-700 font-semibold"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-[3rem] p-10 mt-6 border border-green-100 shadow-sm">
          <h1 className="text-5xl font-extrabold text-green-700">
            Product Marketplace
          </h1>

          <p className="text-gray-600 text-lg mt-3">
            View all products uploaded by farmers and sellers.
          </p>

          {products.length === 0 ? (
            <div className="bg-green-50 rounded-3xl p-8 mt-10">
              <p className="text-lg text-gray-700">
                No products uploaded yet.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 mt-10">
              {products.map(
                (product) => (
                  <div
                    key={
                      product._id
                    }
                    className="bg-green-50 rounded-3xl p-6 border border-green-100"
                  >
                    <h2 className="text-3xl font-extrabold text-green-700">
                      {
                        product.productName
                      }
                    </h2>

                    <div className="space-y-2 mt-5 text-gray-700 text-lg">
                      <p>
                        <b>Seller:</b>{" "}
                        {
                          product.sellerName
                        }
                      </p>

                      <p>
                        <b>Quantity:</b>{" "}
                        {
                          product.quantity
                        }
                      </p>

                      <p>
                        <b>Price:</b> ₹
                        {
                          product.price
                        }
                      </p>

                      <p>
                        <b>Location:</b>{" "}
                        {
                          product.location
                        }
                      </p>

                      <p>
                        <b>Phone:</b>{" "}
                        {
                          product.phone
                        }
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductMarketplacePage
